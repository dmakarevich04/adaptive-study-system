from uuid import uuid4
from dataclasses import dataclass
from datetime import date
from typing import Optional
from .models import Question as QuestionModel, UserAnswer as UserAnswerModel, Test as TestModel, TestResult as TestResultModel, UserModuleKnowledge as UserModuleKnowledgeModel, UserCourseKnowledge as UserCourseKnowledgeModel, ModulePassed as ModulePassedModel, Module as ModuleModel
from .db import SessionLocal

DIFFICULTY_FACTOR_BY_TYPE = {
    'test': 1.0,
    'open': 1.75,
}


@dataclass
class TestScoreBreakdown:
    percent: float
    weighted_points: float
    max_points: float
    accuracy_ratio: float
    time_factor: float

# Keep IDs within JavaScript's integer precision so Swagger/UI clients display them correctly.
_MAX_SAFE_INT = (1 << 53) - 1  # 9007199254740991


def generate_random_id() -> int:
    """Return a positive random integer that fits in Postgres BIGINT and JavaScript safe range."""
    # Use a time-based id (microseconds since epoch) with a small random
    # offset so newer records have larger ids in practice. This makes
    # ordering by `id` behave like ordering by creation time for most cases.
    # Fall back to a UUID-based value if time-based generation fails.
    try:
        import time
        import random

        base = int(time.time() * 1_000_000)
        offset = random.randint(0, 999)
        value = base + offset
        # Clamp to safe JS integer range
        if value <= 0:
            raise ValueError
        if value > _MAX_SAFE_INT:
            # fallback to uuid when time-based value would overflow
            raise OverflowError
        return value
    except Exception:
        # last-resort: deterministic UUID masking as before
        value = uuid4().int & _MAX_SAFE_INT
        return value or 1


def generate_unique_id(db_session, model_cls) -> int:
    """Generate a random bigint that doesn't collide with the given model's primary key."""
    from sqlalchemy.orm import Session  # local import to avoid circular deps

    if not isinstance(db_session, Session):
        raise ValueError("db_session must be a SQLAlchemy Session")

    new_id = generate_random_id()
    attempts = 0
    while db_session.get(model_cls, new_id) is not None:
        attempts += 1
        # Try a reasonable number of times before giving up.
        if attempts > 5:
            raise RuntimeError(
                "Unable to generate unique id after multiple attempts")
        new_id = generate_random_id()
    return new_id


def difficulty_factor_for_type(qtype: Optional[str]) -> float:
    return DIFFICULTY_FACTOR_BY_TYPE.get((qtype or 'test').lower(), 1.0)


def compute_test_score(db, test_id: int, test_result_id: int) -> TestScoreBreakdown:
    """Return a rich breakdown of the weighted scoring formula for a test attempt.

    Формула оценки теста состоит из трёх частей:
    1. За каждый вопрос начисляются баллы: complexityPoints * Ktype, где Ktype =
       1.0 для закрытых вопросов и 1.75 для открытых.
    2. Процент точности = (сумма баллов за верные ответы) / (максимальная сумма
       баллов).
    3. Временной коэффициент = clamp(expected / actual, 0.5, 1.25).
       - если прошли быстрее эталона → коэффициент > 1 и итоговый процент
         увеличивается (но не более +25%).
       - если превысили эталон → коэффициент < 1 и итоговая оценка снижается,
         но не ниже 50% от точности.
    Итоговый процент = clamp(точность * 100 * временной коэффициент, 0, 100).
    """

    test = db.get(TestModel, test_id)
    result = db.get(TestResultModel, test_result_id)
    if not test or not result:
        # Без теста или результата возвращаем пустое значение.
        return TestScoreBreakdown(percent=0.0, weighted_points=0.0, max_points=0.0, accuracy_ratio=0.0, time_factor=1.0)

    expected = float(getattr(test, 'durationInMinutes', 0) or 0)
    actual = float(getattr(result, 'durationInMinutes', 0) or 0)
    if actual <= 0 or expected <= 0:
        time_factor = 1.0
    else:
        raw_ratio = expected / actual
        # Бонус за прохождение быстрее эталона и штраф за превышение времени.
        time_factor = max(0.5, min(1.25, raw_ratio))

    questions = db.query(QuestionModel).filter(
        QuestionModel.testId == test_id).all()
    if not questions:
        fallback_percent = float(max(0.0, min(100.0, float(getattr(result, 'result', 0)))))
        fallback_points = float(getattr(result, 'scoreInPoints', 0) or 0)
        return TestScoreBreakdown(
            percent=fallback_percent,
            weighted_points=fallback_points,
            max_points=0.0,
            accuracy_ratio=fallback_percent / 100.0,
            time_factor=time_factor,
        )

    ua_rows = db.query(UserAnswerModel).filter(
        UserAnswerModel.testResultId == test_result_id).all()
    user_answers_dict = {ua.questionId: ua for ua in ua_rows}

    max_points = 0.0
    earned_points = 0.0

    for question in questions:
        base_weight = float(getattr(question, 'complexityPoints', 1) or 1)
        type_factor = difficulty_factor_for_type(getattr(question, 'questionType', None))
        question_points = base_weight * type_factor
        max_points += question_points

        ua = user_answers_dict.get(question.id)
        if ua and ua.isCorrect:
            earned_points += question_points

    if max_points <= 0:
        return TestScoreBreakdown(percent=0.0, weighted_points=0.0, max_points=0.0, accuracy_ratio=0.0, time_factor=time_factor)

    accuracy_ratio = earned_points / max_points
    raw_percent = accuracy_ratio * 100.0
    final_percent = max(0.0, min(100.0, raw_percent * time_factor))

    return TestScoreBreakdown(
        percent=final_percent,
        weighted_points=earned_points,
        max_points=max_points,
        accuracy_ratio=accuracy_ratio,
        time_factor=time_factor,
    )


def compute_module_knowledge(db, user_id: int, module_id: int) -> float:
    """Aggregate the learner's mastery level for a module.

    New formula (latest-per-test):
    - Для каждого теста модуля берём последнюю попытку пользователя (по
      полю `created_at`) для данного теста.
    - Если у теста нет попыток — он пропускается при усреднении.
    - Уровень знаний модуля = среднее арифметическое процентов последних
      попыток по всем тестам модуля (только тесты с попытками).
    Результат сохраняется в `UserModuleKnowledge` и при необходимости обновляет
    запись в `ModulePassed` (порог 80%).
    """

    import logging
    from datetime import date
    from sqlalchemy import desc

    logger = logging.getLogger(__name__)

    tests = db.query(TestModel).filter(TestModel.moduleId == module_id).all()
    if not tests:
        logger.info(f"No tests found for module {module_id}")
        return 0.0

    logger.info(
        f"Computing knowledge (latest-per-test) for user {user_id}, module {module_id}, found {len(tests)} tests")

    scores = []
    for t in tests:
        tr = (
            db.query(TestResultModel)
            .filter(TestResultModel.testId == t.id, TestResultModel.userId == user_id)
            .order_by(TestResultModel.created_at.desc())
            .first()
        )
        if not tr:
            # No attempts for this test: treat as 0.0 (user hasn't started)
            logger.debug(
                f"No test result for test {t.id} (name: {getattr(t, 'name', 'N/A')}); counting as 0.0")
            scores.append(0.0)
            continue

        percent = float(getattr(tr, 'result', 0) or 0)
        logger.info(
            f"Test {t.id} (name: {getattr(t, 'name', 'N/A')}): latest_result_id={getattr(tr, 'id', None)}, percent={percent}%")
        scores.append(percent)

    if not scores:
        knowledge = 0.0
        logger.info(f"No recent test attempts found for module {module_id}; knowledge = 0.0")
    else:
        knowledge = float(sum(scores)) / float(len(scores))
        logger.info(
            f"Computed module knowledge: {knowledge}% (from {len(scores)} test(s), latest scores: {scores})")

    # persist UserModuleKnowledge
    existing = (
        db.query(UserModuleKnowledgeModel)
        .filter(UserModuleKnowledgeModel.userId == user_id, UserModuleKnowledgeModel.moduleId == module_id)
        .first()
    )
    if existing:
        existing.knowledge = knowledge
        existing.lastUpdated = date.today()
        db.add(existing)
        logger.info(f"Updated existing UserModuleKnowledge: {knowledge}%")
    else:
        umk = UserModuleKnowledgeModel()
        umk.id = generate_random_id()
        umk.userId = user_id
        umk.moduleId = module_id
        umk.knowledge = knowledge
        umk.lastUpdated = date.today()
        db.add(umk)
        logger.info(f"Created new UserModuleKnowledge: {knowledge}%")

    # update ModulePassed if there's an entry for this user/module
    mp = (
        db.query(ModulePassedModel)
        .filter(ModulePassedModel.userId == user_id, ModulePassedModel.moduleId == module_id)
        .first()
    )
    if mp:
        if knowledge >= 80.0:
            mp.isPassed = True
            mp.datePassed = date.today()
            logger.info(f"Module {module_id} marked as passed (knowledge >= 80%)")
        else:
            mp.isPassed = False
            logger.info(f"Module {module_id} not passed (knowledge < 80%)")
        db.add(mp)

    db.commit()
    logger.info(f"Module knowledge computation completed: {knowledge}%")
    return knowledge


def compute_course_knowledge(db, user_id: int, course_id: int) -> float:
    """Aggregate course-level knowledge by averaging module mastery.

    Формула:
    - Берём все модули курса и их `UserModuleKnowledge` (если значения отсутствуют,
      пересчитываем на лету).
    - Уровень знаний курса = среднее арифметическое знаний по модулям.
      Если на модуль ещё не было попыток, он в среднее не попадает.
    Полученный процент сохраняется в `UserCourseKnowledge`.
    """

    # Course-level knowledge: for each module take the latest TestResult across
    # all tests in that module (by created_at). If none exists for a module -> 0.
    # Then course knowledge = arithmetic mean of these per-module values.
    modules = db.query(ModuleModel).filter(ModuleModel.courseId == course_id).all()
    if not modules:
        return 0.0

    per_module_values = []
    from sqlalchemy import desc
    for m in modules:
        # gather test ids for this module
        tests = db.query(TestModel).filter(TestModel.moduleId == m.id).all()
        if not tests:
            # No tests in module -> treat as 0
            per_module_values.append(0.0)
            continue
        test_ids = [t.id for t in tests]

        # find latest test result among tests of this module for the user
        tr = (
            db.query(TestResultModel)
            .filter(TestResultModel.testId.in_(test_ids), TestResultModel.userId == user_id)
            .order_by(TestResultModel.created_at.desc())
            .first()
        )
        if tr:
            per_module_values.append(float(getattr(tr, 'result', 0) or 0))
        else:
            per_module_values.append(0.0)

    if not per_module_values:
        knowledge = 0.0
    else:
        knowledge = float(sum(per_module_values)) / float(len(per_module_values))

    existing_course = (
        db.query(UserCourseKnowledgeModel)
        .filter(UserCourseKnowledgeModel.userId == user_id, UserCourseKnowledgeModel.courseId == course_id)
        .first()
    )
    if existing_course:
        existing_course.knowledge = knowledge
        existing_course.lastUpdated = date.today()
        db.add(existing_course)
    else:
        uck = UserCourseKnowledgeModel()
        uck.id = generate_random_id()
        uck.userId = user_id
        uck.courseId = course_id
        uck.knowledge = knowledge
        uck.lastUpdated = date.today()
        db.add(uck)

    db.commit()
    return knowledge
