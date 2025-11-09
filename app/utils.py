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
            raise RuntimeError("Unable to generate unique id after multiple attempts")
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

    # gather user answers for this test result
    ua_rows = db.query(UserAnswerModel).filter(UserAnswerModel.testResultId == test_result_id).all()
    if ua_rows:
        # fetch question info
        total_weight = 0.0
        correct_weight_sum = 0.0
        # collect difficulty factor numerator (weighted)
        diff_factor_numer = 0.0
        for ua in ua_rows:
            q = db.get(QuestionModel, ua.questionId)
            q_weight = float(getattr(q, 'complexityPoints', 1) or 1)
            total_weight += q_weight
            if ua.isCorrect:
                correct_weight_sum += q_weight
            diff_factor_numer += q_weight * difficulty_factor_for_type(getattr(q, 'questionType', None))

        if total_weight <= 0:
            return 0.0
        base = (correct_weight_sum / total_weight)
        avg_diff_factor = diff_factor_numer / total_weight
        test_score = base * avg_diff_factor * time_factor * 100.0
        return float(max(0.0, min(100.0, test_score)))

    # compute difficulty avg across questions in test
    qs = db.query(QuestionModel).filter(QuestionModel.testId == test_id).all()
    if not qs:
        return float(max(0.0, min(100.0, float(getattr(result, 'result', 0)))))
    total_weight = 0.0
    diff_factor_numer = 0.0
    for q in qs:
        w = float(getattr(q, 'complexityPoints', 1) or 1)
        total_weight += w
        diff_factor_numer += w * difficulty_factor_for_type(getattr(q, 'questionType', None))
    avg_diff_factor = diff_factor_numer / total_weight if total_weight > 0 else 1.0

    base_percent = float(getattr(result, 'result', 0)) / 100.0
    test_score = base_percent * avg_diff_factor * time_factor * 100.0
    return float(max(0.0, min(100.0, test_score)))

def compute_module_knowledge(db, user_id: int, module_id: int) -> float:
    # collect tests in module
    tests = db.query(TestModel).filter(TestModel.moduleId == module_id).all()
    if not tests:
        return 0.0
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
            continue
        sc = compute_test_score(db, t.id, tr.id)
        scores.append(sc)

    if not scores:
        knowledge = 0.0
    else:
        knowledge = float(sum(scores)) / float(len(scores))

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
    else:
        umk = UserModuleKnowledgeModel()
        umk.id = generate_random_id()
        umk.userId = user_id
        umk.moduleId = module_id
        umk.knowledge = knowledge
        umk.lastUpdated = date.today()
        db.add(umk)

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
        else:
            mp.isPassed = False
        db.add(mp)

    db.commit()
    return knowledge

def compute_course_knowledge(db, user_id: int, course_id: int) -> float:
    modules = db.query(ModuleModel).filter(ModuleModel.courseId == course_id).all()
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
        knowledge = float(sum(module_knowledges)) / float(len(module_knowledges))

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
