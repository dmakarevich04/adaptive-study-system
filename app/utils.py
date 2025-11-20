from uuid import uuid4
from datetime import date
from typing import Optional
from .models import Question as QuestionModel, UserAnswer as UserAnswerModel, Test as TestModel, TestResult as TestResultModel, UserModuleKnowledge as UserModuleKnowledgeModel, UserCourseKnowledge as UserCourseKnowledgeModel, ModulePassed as ModulePassedModel, Module as ModuleModel
from .db import SessionLocal

# Configure difficulty factor per question type here
DIFFICULTY_FACTOR_BY_TYPE = {
    'test': 1.0,
    'open': 2.0,
}

# Keep IDs within JavaScript's integer precision so Swagger/UI clients display them correctly.
_MAX_SAFE_INT = (1 << 53) - 1  # 9007199254740991


def generate_random_id() -> int:
    """Return a positive random integer that fits in Postgres BIGINT and JavaScript safe range."""
    value = uuid4().int & _MAX_SAFE_INT
    # Avoid returning 0; bump to 1 if masking yields zero.
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


def compute_test_score(db, test_id: int, test_result_id: int) -> float:
    # load test and result
    test = db.get(TestModel, test_id)
    result = db.get(TestResultModel, test_result_id)
    if not test or not result:
        return 0.0

    # compute time factor
    expected = float(getattr(test, 'durationInMinutes', 0) or 0)
    actual = float(getattr(result, 'durationInMinutes', 0) or 0)
    if actual <= 0 or expected <= 0:
        time_factor = 1.0
    else:
        time_factor = min(1.0, expected / actual)

    # Получаем ВСЕ вопросы теста, а не только те, на которые есть ответы
    all_questions = db.query(QuestionModel).filter(
        QuestionModel.testId == test_id).all()
    if not all_questions:
        return float(max(0.0, min(100.0, float(getattr(result, 'result', 0)))))

    # Создаем словарь ответов пользователя для быстрого доступа
    ua_rows = db.query(UserAnswerModel).filter(
        UserAnswerModel.testResultId == test_result_id).all()
    user_answers_dict = {ua.questionId: ua for ua in ua_rows}

    # Считаем по ВСЕМ вопросам теста
    total_weight = 0.0
    correct_weight_sum = 0.0
    diff_factor_numer = 0.0

    for question in all_questions:
        q_weight = float(getattr(question, 'complexityPoints', 1) or 1)
        total_weight += q_weight
        diff_factor_numer += q_weight * \
            difficulty_factor_for_type(getattr(question, 'questionType', None))

        # Проверяем, есть ли ответ пользователя на этот вопрос
        ua = user_answers_dict.get(question.id)
        if ua and ua.isCorrect:
            correct_weight_sum += q_weight

    if total_weight <= 0:
        return 0.0

    base = (correct_weight_sum / total_weight)
    avg_diff_factor = diff_factor_numer / total_weight
    test_score = base * avg_diff_factor * time_factor * 100.0
    return float(max(0.0, min(100.0, test_score)))


def compute_module_knowledge(db, user_id: int, module_id: int) -> float:
    import logging
    logger = logging.getLogger(__name__)

    # collect tests in module
    tests = db.query(TestModel).filter(TestModel.moduleId == module_id).all()
    if not tests:
        logger.info(f"No tests found for module {module_id}")
        return 0.0

    logger.info(
        f"Computing knowledge for user {user_id}, module {module_id}, found {len(tests)} tests")

    scores = []
    for t in tests:
        # pick latest test result for this user and test
        tr = (
            db.query(TestResultModel)
            .filter(TestResultModel.testId == t.id, TestResultModel.userId == user_id)
            .order_by(TestResultModel.id.desc())
            .first()
        )
        if not tr:
            logger.info(
                f"No test result found for test {t.id} (test name: {getattr(t, 'name', 'N/A')})")
            continue

        # Используем процент из TestResult.result вместо compute_test_score
        # result.result уже содержит правильный процент за весь тест
        sc = float(getattr(tr, 'result', 0) or 0)
        logger.info(
            f"Test {t.id} (name: {getattr(t, 'name', 'N/A')}): result={sc}%, result.id={tr.id}, isPassed={getattr(tr, 'isPassed', False)}")
        scores.append(sc)

    if not scores:
        knowledge = 0.0
        logger.info(f"No scores found, knowledge = 0.0")
    else:
        knowledge = float(sum(scores)) / float(len(scores))
        logger.info(
            f"Computed knowledge: {knowledge}% (from {len(scores)} test(s), scores: {scores})")

    # persist
    from datetime import date

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
            logger.info(
                f"Module {module_id} marked as passed (knowledge >= 80%)")
        else:
            mp.isPassed = False
            logger.info(f"Module {module_id} not passed (knowledge < 80%)")
        db.add(mp)

    db.commit()
    logger.info(f"Module knowledge computation completed: {knowledge}%")
    return knowledge


def compute_course_knowledge(db, user_id: int, course_id: int) -> float:
    modules = db.query(ModuleModel).filter(
        ModuleModel.courseId == course_id).all()
    if not modules:
        return 0.0
    module_knowledges = []
    for m in modules:
        # try to find existing knowledge
        existing = (
            db.query(UserModuleKnowledgeModel)
            .filter(UserModuleKnowledgeModel.userId == user_id, UserModuleKnowledgeModel.moduleId == m.id)
            .first()
        )
        if existing:
            module_knowledges.append(existing.knowledge)
        else:
            # compute on demand
            k = compute_module_knowledge(db, user_id, m.id)
            module_knowledges.append(k)

    if not module_knowledges:
        knowledge = 0.0
    else:
        knowledge = float(sum(module_knowledges)) / \
            float(len(module_knowledges))

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
