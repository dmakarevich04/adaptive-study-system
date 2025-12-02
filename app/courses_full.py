import os
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from .db import get_db
from .deps import get_current_user, require_role
from .models import (
    Answer as AnswerModel,
    Course as CourseModel,
    CourseCategory as CourseCategoryModel,
    CourseEnrollment as CourseEnrollmentModel,
    Module as ModuleModel,
    ModulePassed as ModulePassedModel,
    Permission as PermissionModel,
    Question as QuestionModel,
    Role as RoleModel,
    RolePermission as RolePermissionModel,
    Test as TestModel,
    TestResult as TestResultModel,
    Topic as TopicModel,  # Добавить эту строку
    UserAnswer as UserAnswerModel,
    UserModuleKnowledge as UserModuleKnowledgeModel,
    UserCourseKnowledge as UserCourseKnowledgeModel,
)
from .schemas import (
    CourseCategoryCreate,
    CourseCategoryRead,
    CourseEnrollmentRead,
    PermissionCreate,
    PermissionRead,
    RoleCreate,
    RolePermissionCreate,
    RolePermissionRead,
    RoleRead,
    TestResultRead,
    UserAnswerCreate,
    UserAnswerRead,
    UserModuleKnowledgeCreate,
    UserModuleKnowledgeRead,
    UserCourseKnowledgeCreate,
    UserCourseKnowledgeRead,
)
from .utils import generate_unique_id, compute_test_score, compute_module_knowledge, compute_course_knowledge
from sqlalchemy.exc import IntegrityError

TEST_PASS_PERCENT = int(os.environ.get(
    "TEST_PASS_PERCENT", "80"))  # Изменено с "50" на "80"
_max_attempts_env = os.environ.get(
    "TEST_MAX_ATTEMPTS", None)  # Изменено с "3" на None
TEST_MAX_ATTEMPTS = int(_max_attempts_env) if _max_attempts_env and _max_attempts_env.isdigit(
) and int(_max_attempts_env) > 0 else None

router = APIRouter(prefix="/full", tags=["full"])


@router.post(
    "/admin/categories",
    response_model=CourseCategoryRead,
    dependencies=[Depends(require_role("teacher"))],
    summary="Создать категорию курса",
    description="Добавляет новую категорию курсов. Требуются права преподавателя.",
)
def create_category(payload: CourseCategoryCreate, db: Session = Depends(get_db)):
    category = CourseCategoryModel()
    category.id = generate_unique_id(db, CourseCategoryModel)
    category.name = payload.name
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get(
    "/admin/categories",
    response_model=list[CourseCategoryRead],
    summary="Получить категории курсов",
    description="Возвращает постраничный список категорий курсов.",
)
def list_categories(limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    return db.query(CourseCategoryModel).offset(offset).limit(limit).all()


@router.get(
    "/admin/categories/{cat_id}",
    response_model=CourseCategoryRead,
    summary="Получить категорию курса",
    description="Возвращает категорию по идентификатору или 404, если ее нет.",
)
def get_category(cat_id: int, db: Session = Depends(get_db)):
    category = db.get(CourseCategoryModel, cat_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.put(
    "/admin/categories/{cat_id}",
    response_model=CourseCategoryRead,
    dependencies=[Depends(require_role("teacher"))],
    summary="Обновить категорию курса",
    description="Изменяет название существующей категории. Требуются права преподавателя.",
)
def update_category(cat_id: int, payload: CourseCategoryCreate, db: Session = Depends(get_db)):
    category = db.get(CourseCategoryModel, cat_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    category.name = payload.name
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete(
    "/admin/categories/{cat_id}",
    dependencies=[Depends(require_role("teacher"))],
    summary="Удалить категорию курса",
    description="Удаляет категорию курсов по идентификатору. Требуются права преподавателя.",
)
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    category = db.get(CourseCategoryModel, cat_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
    return {"ok": True}


@router.post(
    "/admin/roles",
    response_model=RoleRead,
    dependencies=[Depends(require_role("admin"))],
    summary="Создать роль",
    description="Добавляет новую роль в систему. Требуются права администратора.",
)
def create_role(payload: RoleCreate, db: Session = Depends(get_db)):
    role = RoleModel()
    role.id = generate_unique_id(db, RoleModel)
    role.name = payload.name
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.get(
    "/admin/roles",
    response_model=list[RoleRead],
    dependencies=[Depends(require_role("admin"))],
    summary="Список ролей",
    description="Возвращает все доступные роли. Только для администраторов.",
)
def list_roles(db: Session = Depends(get_db)):
    return db.query(RoleModel).all()


@router.get(
    "/admin/roles/{role_id}",
    response_model=RoleRead,
    dependencies=[Depends(require_role("admin"))],
    summary="Получить роль",
    description="Возвращает данные роли по идентификатору. Только для администраторов.",
)
def get_role(role_id: int, db: Session = Depends(get_db)):
    role = db.get(RoleModel, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role


@router.put(
    "/admin/roles/{role_id}",
    response_model=RoleRead,
    dependencies=[Depends(require_role("admin"))],
    summary="Обновить роль",
    description="Изменяет название роли. Доступно только администраторам.",
)
def update_role(role_id: int, payload: RoleCreate, db: Session = Depends(get_db)):
    role = db.get(RoleModel, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    role.name = payload.name
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.delete(
    "/admin/roles/{role_id}",
    dependencies=[Depends(require_role("admin"))],
    summary="Удалить роль",
    description="Удаляет роль из системы. Требуются права администратора.",
)
def delete_role(role_id: int, db: Session = Depends(get_db)):
    role = db.get(RoleModel, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    db.delete(role)
    db.commit()
    return {"ok": True}


@router.post(
    "/admin/permissions",
    response_model=PermissionRead,
    dependencies=[Depends(require_role("admin"))],
    summary="Создать разрешение",
    description="Добавляет новое действие в систему разрешений. Только для администраторов.",
)
def create_permission(payload: PermissionCreate, db: Session = Depends(get_db)):
    permission = PermissionModel()
    permission.id = generate_unique_id(db, PermissionModel)
    permission.action = payload.action
    db.add(permission)
    db.commit()
    db.refresh(permission)
    return permission


@router.get(
    "/admin/permissions",
    response_model=list[PermissionRead],
    dependencies=[Depends(require_role("admin"))],
    summary="Список разрешений",
    description="Возвращает все зарегистрированные разрешения. Только для администраторов.",
)
def list_permissions(db: Session = Depends(get_db)):
    return db.query(PermissionModel).all()


@router.get(
    "/admin/permissions/{perm_id}",
    response_model=PermissionRead,
    dependencies=[Depends(require_role("admin"))],
    summary="Получить разрешение",
    description="Возвращает разрешение по идентификатору. Только для администраторов.",
)
def get_permission(perm_id: int, db: Session = Depends(get_db)):
    permission = db.get(PermissionModel, perm_id)
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    return permission


@router.put(
    "/admin/permissions/{perm_id}",
    response_model=PermissionRead,
    dependencies=[Depends(require_role("admin"))],
    summary="Обновить разрешение",
    description="Изменяет действие существующего разрешения. Только для администраторов.",
)
def update_permission(perm_id: int, payload: PermissionCreate, db: Session = Depends(get_db)):
    permission = db.get(PermissionModel, perm_id)
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    permission.action = payload.action
    db.add(permission)
    db.commit()
    db.refresh(permission)
    return permission


@router.delete(
    "/admin/permissions/{perm_id}",
    dependencies=[Depends(require_role("admin"))],
    summary="Удалить разрешение",
    description="Удаляет разрешение из системы. Только для администраторов.",
)
def delete_permission(perm_id: int, db: Session = Depends(get_db)):
    permission = db.get(PermissionModel, perm_id)
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    db.delete(permission)
    db.commit()
    return {"ok": True}


@router.post(
    "/admin/role-permissions",
    response_model=RolePermissionRead,
    dependencies=[Depends(require_role("admin"))],
    summary="Назначить разрешение роли",
    description="Создает связь между ролью и разрешением. Доступно только администраторам.",
)
def create_role_permission(payload: RolePermissionCreate, db: Session = Depends(get_db)):
    rp = RolePermissionModel()
    rp.id = generate_unique_id(db, RolePermissionModel)
    rp.roleId = payload.roleId
    rp.permissionId = payload.permissionId
    db.add(rp)
    db.commit()
    db.refresh(rp)
    return rp


@router.get(
    "/admin/role-permissions",
    response_model=list[RolePermissionRead],
    dependencies=[Depends(require_role("admin"))],
    summary="Список назначенных разрешений",
    description="Возвращает все связи ролей и разрешений. Только для администраторов.",
)
def list_role_permissions(db: Session = Depends(get_db)):
    return db.query(RolePermissionModel).all()


@router.get(
    "/admin/role-permissions/{rp_id}",
    response_model=RolePermissionRead,
    dependencies=[Depends(require_role("admin"))],
    summary="Получить назначенное разрешение",
    description="Возвращает конкретную связь роли и разрешения по идентификатору. Только для администраторов.",
)
def get_role_permission(rp_id: int, db: Session = Depends(get_db)):
    rp = db.get(RolePermissionModel, rp_id)
    if not rp:
        raise HTTPException(status_code=404, detail="RolePermission not found")
    return rp


@router.put(
    "/admin/role-permissions/{rp_id}",
    response_model=RolePermissionRead,
    dependencies=[Depends(require_role("admin"))],
    summary="Обновить назначение разрешения",
    description="Изменяет связь между ролью и разрешением. Только для администраторов.",
)
def update_role_permission(rp_id: int, payload: RolePermissionCreate, db: Session = Depends(get_db)):
    rp = db.get(RolePermissionModel, rp_id)
    if not rp:
        raise HTTPException(status_code=404, detail="RolePermission not found")
    rp.roleId = payload.roleId
    rp.permissionId = payload.permissionId
    db.add(rp)
    db.commit()
    db.refresh(rp)
    return rp


@router.delete(
    "/admin/role-permissions/{rp_id}",
    dependencies=[Depends(require_role("admin"))],
    summary="Удалить назначение разрешения",
    description="Удаляет связь роли и разрешения. Только для администраторов.",
)
def delete_role_permission(rp_id: int, db: Session = Depends(get_db)):
    rp = db.get(RolePermissionModel, rp_id)
    if not rp:
        raise HTTPException(status_code=404, detail="RolePermission not found")
    db.delete(rp)
    db.commit()
    return {"ok": True}


@router.get(
    "/admin/enrollments",
    dependencies=[Depends(require_role("admin"))],
    summary="Список всех записей на курсы",
    description="Возвращает все записи студентов на курсы. Доступно только администраторам.",
)
def admin_list_enrollments(db: Session = Depends(get_db)):
    return db.query(CourseEnrollmentModel).all()


@router.get(
    "/admin/enrollments/{enroll_id}",
    dependencies=[Depends(require_role("admin"))],
    summary="Получить запись на курс",
    description="Возвращает данные конкретной записи на курс по идентификатору. Только для администраторов.",
)
def admin_get_enrollment(enroll_id: int, db: Session = Depends(get_db)):
    enrollment = db.get(CourseEnrollmentModel, enroll_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    return enrollment


@router.delete(
    "/admin/enrollments/{enroll_id}",
    dependencies=[Depends(require_role("admin"))],
    summary="Удалить запись на курс",
    description="Удаляет запись студента на курс. Доступно только администраторам.",
)
def admin_delete_enrollment(enroll_id: int, db: Session = Depends(get_db)):
    enrollment = db.get(CourseEnrollmentModel, enroll_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    db.delete(enrollment)
    db.commit()
    return {"ok": True}


@router.get(
    "/admin/module-passed",
    dependencies=[Depends(require_role("admin"))],
    summary="Список статусов прохождения модулей",
    description="Возвращает все записи о прохождении модулей пользователями. Только для администраторов.",
)
def admin_list_module_passed(db: Session = Depends(get_db)):
    return db.query(ModulePassedModel).all()


@router.get(
    "/admin/module-passed/{mp_id}",
    dependencies=[Depends(require_role("admin"))],
    summary="Получить статус прохождения модуля",
    description="Возвращает запись о прохождении модуля по идентификатору. Только для администраторов.",
)
def admin_get_module_passed(mp_id: int, db: Session = Depends(get_db)):
    module_passed = db.get(ModulePassedModel, mp_id)
    if not module_passed:
        raise HTTPException(status_code=404, detail="ModulePassed not found")
    return module_passed


@router.get(
    "/results",
    response_model=list[TestResultRead],
    summary="Мои результаты тестов",
    description="Возвращает результаты тестов для текущего пользователя.",
)
def my_results(current=Depends(get_current_user), db: Session = Depends(get_db)):
    uid = int(current.id)
    return db.query(TestResultModel).filter(TestResultModel.userId == uid).order_by(TestResultModel.created_at.desc()).all()


@router.get(
    "/results/{result_id}",
    response_model=TestResultRead,
    summary="Получить результат теста",
    description="Возвращает результат теста, если пользователь — владелец, автор курса или администратор.",
)
def get_result(result_id: int, current=Depends(get_current_user), db: Session = Depends(get_db)):
    result = db.get(TestResultModel, result_id)
    if not result:
        raise HTTPException(status_code=404, detail="TestResult not found")
    uid = int(current.id)
    if result.userId == uid:
        return result
    if current.role == "admin":
        return result
    test = db.get(TestModel, result.testId)
    course_obj = None
    if test:
        if test.courseId:
            course_obj = db.get(CourseModel, test.courseId)
        elif test.moduleId:
            module = db.get(ModuleModel, test.moduleId)
            course_obj = db.get(
                CourseModel, module.courseId) if module else None
    if course_obj and int(course_obj.authorId) == uid:
        return result
    raise HTTPException(status_code=403, detail="Not authorized")


@router.post(
    "/courses/{course_id}/enroll",
    response_model=CourseEnrollmentRead,
    summary="Записаться на курс",
    description="Создает запись студента на опубликованный курс.",
)
def enroll_course(course_id: int, current=Depends(get_current_user), db: Session = Depends(get_db)):
    course = db.get(CourseModel, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not getattr(course, "isPublished", False):
        raise HTTPException(status_code=400, detail="Course not published")
    uid = int(current.id)
    exists = (
        db.query(CourseEnrollmentModel)
        .filter(CourseEnrollmentModel.courseId == course_id, CourseEnrollmentModel.userId == uid)
        .first()
    )
    if exists:
        raise HTTPException(status_code=400, detail="Already enrolled")
    enrollment = CourseEnrollmentModel()
    enrollment.id = generate_unique_id(db, CourseEnrollmentModel)
    enrollment.courseId = course_id
    enrollment.userId = uid
    enrollment.dateStarted = date.today()
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.delete(
    "/courses/{course_id}/enroll",
    summary="Отменить запись на курс",
    description="Удаляет запись студента на курс, если она существует.",
)
def unenroll_course(course_id: int, current=Depends(get_current_user), db: Session = Depends(get_db)):
    uid = int(current.id)
    enrollment = (
        db.query(CourseEnrollmentModel)
        .filter(CourseEnrollmentModel.courseId == course_id, CourseEnrollmentModel.userId == uid)
        .first()
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    db.delete(enrollment)
    db.commit()
    return {"ok": True}


@router.post(
    "/tests/{test_id}/submit",
    summary="Сдать тест",
    description="Принимает ответы пользователя, проверяет их и сохраняет результат попытки.",
)
def submit_test(
    test_id: int,
    request_body: dict = Body(...),  # Изменено: принимаем весь body как dict
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    uid = int(current_user.id)

    # Извлекаем answers и duration_in_minutes из body
    answers = request_body.get("answers", {})
    # Expect duration_in_minutes as a number (can be fractional). Use float for precision.
    try:
        duration_in_minutes = float(request_body.get("duration_in_minutes", 0) or 0)
    except Exception:
        duration_in_minutes = 0.0

    # Логирование для отладки
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Received answers: {answers}, type: {type(answers)}")
    # УБРАТЬ эту строку - questions еще не определен
    # logger.info(f"Question IDs in test: {[q.id for q in questions]}")

    # Keep fractional minutes (e.g. 90s -> 1.5). Clamp negatives to 0.
    if duration_in_minutes < 0:
        duration_in_minutes = 0.0

    test = db.get(TestModel, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    course_id_for_check = None
    if test.courseId:
        course_id_for_check = test.courseId
    elif test.moduleId:
        module = db.get(ModuleModel, test.moduleId)
        if not module:
            raise HTTPException(
                status_code=404, detail="Module for test not found")
        course_id_for_check = module.courseId

    if course_id_for_check is not None:
        enrolled = (
            db.query(CourseEnrollmentModel)
            .filter(CourseEnrollmentModel.courseId == course_id_for_check, CourseEnrollmentModel.userId == uid)
            .first()
        )
        if not enrolled:
            raise HTTPException(
                status_code=403, detail="User is not enrolled in the course for this test")

    questions = db.query(QuestionModel).filter(
        QuestionModel.testId == test_id).all()
    total_questions = len(questions)
    if total_questions == 0:
        raise HTTPException(status_code=400, detail="Test has no questions")

    # Теперь можно логировать questions, так как они уже определены
    logger.info(f"Question IDs in test: {[q.id for q in questions]}")

    attempts_count = (
        db.query(TestResultModel)
        .filter(TestResultModel.testId == test_id, TestResultModel.userId == uid)
        .count()
    )
    if TEST_MAX_ATTEMPTS is not None and attempts_count >= TEST_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=400, detail=f"Max attempts reached ({TEST_MAX_ATTEMPTS})")

    correct = 0
    for question in questions:
        provided: Any | None = None
        if isinstance(answers, dict):
            # Пробуем получить ответ по числовому ключу (если ключи - числа)
            provided = answers.get(question.id)
            # Если не нашли, пробуем строковый ключ (JSON всегда использует строки)
            if provided is None:
                provided = answers.get(str(question.id))
        if provided is None:
            logger.warning(f"No answer provided for question {question.id}")
            continue

        # ВАЖНО: Сначала проверяем тип вопроса, потом обрабатываем ответ
        # Обработка открытых вопросов
        if question.questionType == 'open':
            # Для открытых вопросов provided - это текст ответа
            if not isinstance(provided, str):
                provided = str(provided)

            # Нормализуем ответ пользователя: убираем пробелы и приводим к нижнему регистру
            user_answer_normalized = provided.strip().lower()

            # Получаем правильные ответы для этого вопроса
            correct_answers = db.query(AnswerModel).filter(
                AnswerModel.questionId == question.id,
                AnswerModel.isCorrect == True
            ).all()

            is_correct = False
            for correct_answer in correct_answers:
                # Нормализуем правильный ответ
                correct_text_normalized = correct_answer.text.strip().lower()
                if user_answer_normalized == correct_text_normalized:
                    is_correct = True
                    break

            if is_correct:
                correct += 1
                logger.info(
                    f"Correct open answer for question {question.id}! Total correct: {correct}")
            else:
                logger.info(
                    f"Incorrect open answer for question {question.id}. User: '{user_answer_normalized}', Expected one of: {[ca.text.strip().lower() for ca in correct_answers]}")

        # Обработка тестовых вопросов
        else:
            try:
                answer_id = int(provided)
                logger.info(f"Question {question.id}: answer_id={answer_id}")
            except Exception:
                logger.error(f"Failed to convert answer to int: {provided}")
                continue
            answer = db.get(AnswerModel, answer_id)
            if answer:
                logger.info(
                    f"Answer {answer_id}: questionId={answer.questionId}, isCorrect={answer.isCorrect}")
                if answer.questionId == question.id and answer.isCorrect:
                    correct += 1
                    logger.info(f"Correct answer! Total correct: {correct}")
            else:
                logger.warning(f"Answer {answer_id} not found in database")

    logger.info(f"Total correct: {correct} out of {total_questions}")

    percent = int((correct / total_questions) * 100)
    passed = percent >= TEST_PASS_PERCENT

    result = TestResultModel()
    result.id = generate_unique_id(db, TestResultModel)
    result.scoreInPoints = correct
    # initially mark based on raw percent; will update after detailed scoring
    result.isPassed = passed
    result.durationInMinutes = duration_in_minutes  # Используем переданное время
    result.result = percent
    result.testId = test_id
    result.userId = uid
    db.add(result)
    db.commit()
    db.refresh(result)

    # Bulk-save UserAnswer rows based on provided answers (if any)
    # Вычисляем время на один вопрос (если есть ответы)
    time_per_answer = 0
    if duration_in_minutes > 0 and len(answers) > 0:
        # Распределяем время равномерно между всеми ответами
        time_per_answer = duration_in_minutes / len(answers)

    try:
        for question in questions:
            provided: Any | None = None
            if isinstance(answers, dict):
                provided = answers.get(question.id)
                if provided is None:
                    provided = answers.get(str(question.id))
            if provided is None:
                continue

            # ВАЖНО: Сначала проверяем тип вопроса, потом обрабатываем ответ
            # Обработка открытых вопросов
            if question.questionType == 'open':
                if not isinstance(provided, str):
                    provided = str(provided)

                # Нормализуем ответ пользователя
                user_answer_normalized = provided.strip().lower()

                # Получаем правильные ответы для этого вопроса
                correct_answers = db.query(AnswerModel).filter(
                    AnswerModel.questionId == question.id,
                    AnswerModel.isCorrect == True
                ).all()

                is_correct = False
                for correct_answer in correct_answers:
                    correct_text_normalized = correct_answer.text.strip().lower()
                    if user_answer_normalized == correct_text_normalized:
                        is_correct = True
                        break

                # Сохраняем UserAnswer для открытого вопроса
                ua = UserAnswerModel()
                ua.id = generate_unique_id(db, UserAnswerModel)
                ua.userId = uid
                ua.testResultId = result.id
                ua.questionId = question.id
                ua.isCorrect = is_correct
                # Устанавливаем время прохождения для этого ответа
                if time_per_answer < 1:
                    ua.timeSpentInMinutes = 0
                else:
                    ua.timeSpentInMinutes = int(time_per_answer)
                db.add(ua)

            # Обработка тестовых вопросов
            else:
                try:
                    answer_id = int(provided)
                except Exception:
                    logger.warning(
                        f"Failed to convert answer to int for question {question.id}: {provided}")
                    continue
                answer = db.get(AnswerModel, answer_id)
                # Only save if the answer belongs to the question
                if answer and answer.questionId == question.id:
                    ua = UserAnswerModel()
                    ua.id = generate_unique_id(db, UserAnswerModel)
                    ua.userId = uid
                    ua.testResultId = result.id
                    ua.questionId = question.id
                    ua.isCorrect = bool(answer.isCorrect)
                    # Устанавливаем время прохождения для этого ответа
                    if time_per_answer < 1:
                        ua.timeSpentInMinutes = 0
                    else:
                        ua.timeSpentInMinutes = int(time_per_answer)
                    db.add(ua)
        db.commit()
    except Exception as e:
        # Логируем ошибку для отладки
        logger.error(f"Error saving UserAnswer: {e}", exc_info=True)
        # don't fail test submission on UserAnswer save error
        db.rollback()

    # Recompute precise test score using per-question data if available
    try:
        # Получаем все ответы пользователя
        user_answers_all = db.query(UserAnswerModel).filter(
            UserAnswerModel.testResultId == result.id
        ).all()

        # Считаем правильные ответы из всех сохраненных
        correct_from_answers = sum(
            1 for ua in user_answers_all if ua.isCorrect)

        # Новый пересчет: используем формулу из utils.compute_test_score
        breakdown = compute_test_score(db, test_id, result.id)

        logger.info(
            "Score breakdown: percent=%s, weighted_points=%s/%s, accuracy=%.2f, time_factor=%.2f",
            breakdown.percent,
            breakdown.weighted_points,
            breakdown.max_points,
            breakdown.accuracy_ratio,
            breakdown.time_factor,
        )

        result.result = int(round(breakdown.percent))
        result.isPassed = breakdown.percent >= TEST_PASS_PERCENT
        # Оставляем `scoreInPoints` как количество правильных ответов (raw count)
        # чтобы интерфейс отображал корректное соотношение "Правильных ответов: X из Y".
        # Подробная разбивка (weighted points, time_factor и т.д.) логируется выше,
        # но в текущей схеме БД нет отдельного поля для хранения взвешенных баллов.
        result.scoreInPoints = int(correct)

        logger.info(
            f"Final result: percent={result.result}, isPassed={result.isPassed}, scoreInPoints={result.scoreInPoints}")

        db.add(result)
        db.commit()
        db.refresh(result)
        
        # Убеждаемся, что результат действительно обновлен
        logger.info(f"After commit, result.result = {result.result}")
    except Exception as e:
        # Логируем ошибку для отладки
        logger.error(f"Error recomputing test score: {e}", exc_info=True)
        # ignore recalculation errors to avoid breaking submission
        db.rollback()
        # Если пересчет не удался, оставляем исходные значения
        logger.info(
            f"Keeping original values: percent={percent}, isPassed={passed}, scoreInPoints={correct}")

    # update ModulePassed using the (possibly recomputed) result
    if test and test.moduleId:
        module_passed = (
            db.query(ModulePassedModel)
            .filter(ModulePassedModel.moduleId == test.moduleId, ModulePassedModel.userId == uid)
            .first()
        )
        if module_passed:
            if result.isPassed and not module_passed.isPassed:
                module_passed.isPassed = True
                db.add(module_passed)
                db.commit()
                db.refresh(module_passed)
            else:
                # ensure flag reflects latest
                module_passed.isPassed = bool(module_passed.isPassed)
                db.add(module_passed)
                db.commit()
                db.refresh(module_passed)
        else:
            module_passed = ModulePassedModel()
            module_passed.id = generate_unique_id(db, ModulePassedModel)
            module_passed.moduleId = test.moduleId
            module_passed.isPassed = bool(result.isPassed)
            module_passed.userId = uid
            db.add(module_passed)
            try:
                db.commit()
                db.refresh(module_passed)
            except IntegrityError as ie:
                # Handle possible schema-level unique constraint issues (existing DB may
                # have an unexpected unique index on userId). In that case, try to find
                # the conflicting record by userId and update it instead of inserting.
                db.rollback()
                existing_conflict = db.query(ModulePassedModel).filter(ModulePassedModel.userId == uid).first()
                if existing_conflict:
                    existing_conflict.moduleId = test.moduleId
                    existing_conflict.isPassed = bool(result.isPassed)
                    db.add(existing_conflict)
                    db.commit()
                    db.refresh(existing_conflict)
                    module_passed = existing_conflict
                    # Log the recovery action
                    import logging
                    logging.getLogger(__name__).warning(
                        "IntegrityError inserting ModulePassed; updated existing record for user=%s", uid)
                else:
                    # Re-raise if we cannot resolve the conflict
                    raise

    # Trigger recompute of aggregated module/course knowledge for this user
    computed_knowledge = None
    computed_course_knowledge = None
    try:
        # Убеждаемся, что result обновлен в базе данных
        # Делаем еще один refresh после всех коммитов
        db.refresh(result)
        
        # Логируем перед вызовом compute_module_knowledge
        logger.info(f"Before compute_module_knowledge: test_id={test_id}, result.id={result.id}, result.result={result.result}, test.moduleId={test.moduleId if test else None}")
        
        if test and test.moduleId:
            # Вызываем с правильным количеством аргументов (только 3)
            computed_knowledge = compute_module_knowledge(db, uid, test.moduleId)
            logger.info(f"Computed module knowledge: {computed_knowledge}%")
        # derive course id
        course_id_for_calc = None
        if test and test.courseId:
            course_id_for_calc = test.courseId
        elif test and test.moduleId:
            mod = db.get(ModuleModel, test.moduleId)
            course_id_for_calc = getattr(
                mod, 'courseId', None) if mod else None
        if course_id_for_calc:
            computed_course_knowledge = compute_course_knowledge(db, uid, course_id_for_calc)
            logger.info(f"Computed course knowledge: {computed_course_knowledge}%")
    except Exception as e:
        # Логируем ошибку для отладки
        logger.error(f"Error recomputing module/course knowledge: {e}", exc_info=True)
        # don't fail submission on aggregate recalculation error
        pass

    # Генерация рекомендаций
    recommendations = []

    # Получаем все ответы пользователя для этого теста
    user_answers = db.query(UserAnswerModel).filter(
        UserAnswerModel.testResultId == result.id
    ).all()

    # Проверяем, вышел ли пользователь за таймаут
    test_duration = getattr(test, 'durationInMinutes', 0) or 0
    is_timeout = False
    if test_duration > 0 and duration_in_minutes > test_duration:
        is_timeout = True
        recommendations.append({
            "type": "timeout",
            "message": f"Вы превысили отведенное время на тест ({test_duration} минут). Рекомендуем повторить весь материал модуля для лучшего усвоения."
        })

    # Собираем информацию о неправильных ответах
    incorrect_answers = [ua for ua in user_answers if not ua.isCorrect]
    incorrect_test_questions = []
    incorrect_open_questions = []
    topics_with_errors = set()

    for ua in incorrect_answers:
        question = db.get(QuestionModel, ua.questionId)
        if question:
            if question.topicId:
                topics_with_errors.add(question.topicId)

            if question.questionType == 'test':
                incorrect_test_questions.append(question)
            elif question.questionType == 'open':
                incorrect_open_questions.append(question)

    # Генерируем рекомендации по темам
    if topics_with_errors:
        topic_names = []
        for topic_id in topics_with_errors:
            topic = db.get(TopicModel, topic_id)
            if topic:
                topic_names.append(topic.name)

        if topic_names:
            topics_str = ", ".join(topic_names)
            recommendations.append({
                "type": "topics",
                "message": f"Рекомендуем повторить следующие темы, в которых были допущены ошибки: {topics_str}.",
                "topic_ids": list(topics_with_errors)
            })

    # Рекомендации по типам вопросов
    if incorrect_test_questions:
        recommendations.append({
            "type": "question_type",
            "message": "Вы допустили ошибки в тестовых вопросах. Рекомендуем более внимательно изучать материал и практиковаться с тестовыми заданиями."
        })

    if incorrect_open_questions:
        recommendations.append({
            "type": "question_type",
            "message": "Вы допустили ошибки в открытых вопросах. Рекомендуем больше практиковаться в формулировании развернутых ответов и повторно изучить соответствующий материал."
        })

    # Если ошибок не было
    if not incorrect_answers and not is_timeout:
        recommendations.append({
            "type": "success",
            "message": "Отлично! Вы хорошо усвоили материал модуля. Можете переходить к следующему модулю."
        })

    return {
        "score": result.scoreInPoints,
        "percent": result.result,
        "passed": result.isPassed,
        "attempts": attempts_count + 1,
        "recommendations": recommendations,  # Добавить рекомендации
        "module_knowledge": computed_knowledge,
        "course_knowledge": computed_course_knowledge,
    }


@router.post(
    "/answers",
    response_model=UserAnswerRead,
    summary="Сохранить ответ на вопрос",
    description="Сохраняет один ответ пользователя на вопрос (используется при детальном сохранении теста).",
)
def create_user_answer(payload: UserAnswerCreate, current=Depends(get_current_user), db: Session = Depends(get_db)):
    uid = int(current.id)
    # enforce that user can only create answers for themselves
    if payload.userId != uid:
        raise HTTPException(
            status_code=403, detail="Cannot create answers for other users")
    ua = UserAnswerModel()
    ua.id = generate_unique_id(db, UserAnswerModel)
    ua.userId = payload.userId
    ua.testResultId = payload.testResultId
    ua.questionId = payload.questionId
    ua.isCorrect = payload.isCorrect
    ua.timeSpentInMinutes = payload.timeSpentInMinutes
    db.add(ua)
    db.commit()
    db.refresh(ua)

    # Trigger recalculation of module and course knowledge when a new answer appears
    # УБРАТЬ этот блок, так как пересчет должен происходить только после завершения всего теста
    # в submit_test, а не при создании каждого ответа
    # try:
    #     # determine test/module/course from question/test
    #     q = db.get(QuestionModel, ua.questionId)
    #     if q:
    #         test_obj = db.get(TestModel, getattr(q, 'testId', None))
    #         module_id = getattr(test_obj, 'moduleId',
    #                             None) if test_obj else None
    #         course_id = getattr(test_obj, 'courseId',
    #                             None) if test_obj else None
    #         # compute module knowledge if applicable
    #         if module_id:
    #             compute_module_knowledge(db, ua.userId, module_id)
    #         # compute course knowledge; if test links to module, derive course from module
    #         if not course_id and module_id:
    #             mod = db.get(ModuleModel, module_id)
    #             course_id = getattr(mod, 'courseId', None) if mod else None
    #         if course_id:
    #             compute_course_knowledge(db, ua.userId, course_id)
    # except Exception:
    #     # Don't fail the request if recalculation fails; log could be added here.
    #     pass

    return ua


@router.get(
    "/answers/me",
    response_model=list[UserAnswerRead],
    summary="Мои ответы на вопросы",
    description="Возвращает все сохранённые ответы текущего пользователя.",
)
def my_answers(current=Depends(get_current_user), db: Session = Depends(get_db)):
    uid = int(current.id)
    return db.query(UserAnswerModel).filter(UserAnswerModel.userId == uid).all()


@router.get(
    "/admin/answers",
    response_model=list[UserAnswerRead],
    dependencies=[Depends(require_role("admin"))],
    summary="Список всех ответов",
    description="Возвращает все записи UserAnswer. Только для администраторов.",
)
def admin_list_answers(db: Session = Depends(get_db)):
    return db.query(UserAnswerModel).all()


@router.get(
    "/admin/answers/{ua_id}",
    response_model=UserAnswerRead,
    dependencies=[Depends(require_role("admin"))],
    summary="Получить ответ пользователя",
)
def admin_get_answer(ua_id: int, db: Session = Depends(get_db)):
    ua = db.get(UserAnswerModel, ua_id)
    if not ua:
        raise HTTPException(status_code=404, detail="UserAnswer not found")
    return ua


@router.delete(
    "/admin/answers/{ua_id}",
    dependencies=[Depends(require_role("admin"))],
    summary="Удалить ответ пользователя",
)
def admin_delete_answer(ua_id: int, db: Session = Depends(get_db)):
    ua = db.get(UserAnswerModel, ua_id)
    if not ua:
        raise HTTPException(status_code=404, detail="UserAnswer not found")
    db.delete(ua)
    db.commit()
    return {"ok": True}


@router.get(
    "/me/modules/knowledge",
    response_model=list[UserModuleKnowledgeRead],
    summary="Уровень знаний по модулям (мои)",
    description="Возвращает агрегированные знания пользователя по модулям.",
)
def my_module_knowledge(current=Depends(get_current_user), db: Session = Depends(get_db)):
    uid = int(current.id)
    return db.query(UserModuleKnowledgeModel).filter(UserModuleKnowledgeModel.userId == uid).all()


@router.get(
    "/admin/module-knowledge",
    response_model=list[UserModuleKnowledgeRead],
    dependencies=[Depends(require_role("admin"))],
    summary="Список знаний по модулям",
    description="Возвращает все записи UserModuleKnowledge. Только для администраторов.",
)
def admin_list_module_knowledge(db: Session = Depends(get_db)):
    return db.query(UserModuleKnowledgeModel).all()


@router.get(
    "/admin/module-knowledge/{umk_id}",
    response_model=UserModuleKnowledgeRead,
    dependencies=[Depends(require_role("admin"))],
    summary="Получить UserModuleKnowledge",
)
def admin_get_module_knowledge(umk_id: int, db: Session = Depends(get_db)):
    umk = db.get(UserModuleKnowledgeModel, umk_id)
    if not umk:
        raise HTTPException(
            status_code=404, detail="UserModuleKnowledge not found")
    return umk


@router.post(
    "/admin/module-knowledge",
    response_model=UserModuleKnowledgeRead,
    dependencies=[Depends(require_role("admin"))],
    summary="Создать/обновить UserModuleKnowledge",
)
def admin_create_module_knowledge(payload: UserModuleKnowledgeCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(UserModuleKnowledgeModel)
        .filter(UserModuleKnowledgeModel.userId == payload.userId, UserModuleKnowledgeModel.moduleId == payload.moduleId)
        .first()
    )
    if existing:
        existing.knowledge = payload.knowledge
        existing.lastUpdated = date.today()
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing
    umk = UserModuleKnowledgeModel()
    umk.id = generate_unique_id(db, UserModuleKnowledgeModel)
    umk.userId = payload.userId
    umk.moduleId = payload.moduleId
    umk.knowledge = payload.knowledge
    umk.lastUpdated = date.today()
    db.add(umk)
    db.commit()
    db.refresh(umk)
    return umk


@router.get(
    "/me/courses/knowledge",
    response_model=list[UserCourseKnowledgeRead],
    summary="Уровень знаний по курсам (мои)",
)
def my_course_knowledge(current=Depends(get_current_user), db: Session = Depends(get_db)):
    uid = int(current.id)
    return db.query(UserCourseKnowledgeModel).filter(UserCourseKnowledgeModel.userId == uid).all()


@router.get(
    "/admin/course-knowledge",
    response_model=list[UserCourseKnowledgeRead],
    dependencies=[Depends(require_role("admin"))],
    summary="Список знаний по курсам",
)
def admin_list_course_knowledge(db: Session = Depends(get_db)):
    return db.query(UserCourseKnowledgeModel).all()


@router.get(
    "/admin/course-knowledge/{uck_id}",
    response_model=UserCourseKnowledgeRead,
    dependencies=[Depends(require_role("admin"))],
)
def admin_get_course_knowledge(uck_id: int, db: Session = Depends(get_db)):
    uck = db.get(UserCourseKnowledgeModel, uck_id)
    if not uck:
        raise HTTPException(
            status_code=404, detail="UserCourseKnowledge not found")
    return uck


@router.post(
    "/admin/course-knowledge",
    response_model=UserCourseKnowledgeRead,
    dependencies=[Depends(require_role("admin"))],
)
def admin_create_course_knowledge(payload: UserCourseKnowledgeCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(UserCourseKnowledgeModel)
        .filter(UserCourseKnowledgeModel.userId == payload.userId, UserCourseKnowledgeModel.courseId == payload.courseId)
        .first()
    )
    if existing:
        existing.knowledge = payload.knowledge
        existing.lastUpdated = date.today()
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing
    uck = UserCourseKnowledgeModel()
    uck.id = generate_unique_id(db, UserCourseKnowledgeModel)
    uck.userId = payload.userId
    uck.courseId = payload.courseId
    uck.knowledge = payload.knowledge
    uck.lastUpdated = date.today()
    db.add(uck)
    db.commit()
    db.refresh(uck)
    return uck


@router.get(
    "/teacher/course/{course_id}/students/knowledge",
    response_model=list[UserCourseKnowledgeRead],
    dependencies=[Depends(require_role("teacher"))],
    summary="Статусы знаний студентов по курсу (для преподавателя)",
    description="Возвращает уровень знаний всех студентов по курсу. Доступно только автору курса (преподавателю).",
)
def teacher_list_students_course_knowledge(course_id: int, current=Depends(get_current_user), db: Session = Depends(get_db)):
    # only the course author (teacher) or admin can view
    course = db.get(CourseModel, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    uid = int(current.id)
    # allow admin
    if getattr(current, 'role', None) == 'admin':
        return db.query(UserCourseKnowledgeModel).filter(UserCourseKnowledgeModel.courseId == course_id).all()
    # check author
    if int(course.authorId) != uid:
        raise HTTPException(status_code=403, detail="Not authorized")
    # return knowledge for users enrolled in this course
    enrollments = db.query(CourseEnrollmentModel).filter(
        CourseEnrollmentModel.courseId == course_id).all()
    user_ids = [e.userId for e in enrollments]
    if not user_ids:
        return []
    return db.query(UserCourseKnowledgeModel).filter(UserCourseKnowledgeModel.courseId == course_id, UserCourseKnowledgeModel.userId.in_(user_ids)).all()


@router.get(
    "/teacher/course/{course_id}/knowledge/{user_id}",
    response_model=UserCourseKnowledgeRead,
    dependencies=[Depends(require_role("teacher"))],
    summary="Уровень знаний конкретного студента по курсу (для преподавателя)",
)
def teacher_get_student_course_knowledge(course_id: int, user_id: int, current=Depends(get_current_user), db: Session = Depends(get_db)):
    course = db.get(CourseModel, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    uid = int(current.id)
    if getattr(current, 'role', None) != 'admin' and int(course.authorId) != uid:
        raise HTTPException(status_code=403, detail="Not authorized")
    uck = (
        db.query(UserCourseKnowledgeModel)
        .filter(UserCourseKnowledgeModel.courseId == course_id, UserCourseKnowledgeModel.userId == user_id)
        .first()
    )
    if not uck:
        raise HTTPException(
            status_code=404, detail="UserCourseKnowledge not found")
    return uck


@router.get(
    "/teacher/module/{module_id}/knowledge/{user_id}",
    response_model=UserModuleKnowledgeRead,
    dependencies=[Depends(require_role("teacher"))],
    summary="Уровень знаний студента по модулю (для преподавателя)",
)
def teacher_get_student_module_knowledge(module_id: int, user_id: int, current=Depends(get_current_user), db: Session = Depends(get_db)):
    module = db.get(ModuleModel, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    # verify teacher is author of parent course
    course = db.get(
        CourseModel, module.courseId) if module and module.courseId else None
    uid = int(current.id)
    if getattr(current, 'role', None) != 'admin' and (not course or int(course.authorId) != uid):
        raise HTTPException(status_code=403, detail="Not authorized")
    umk = (
        db.query(UserModuleKnowledgeModel)
        .filter(UserModuleKnowledgeModel.moduleId == module_id, UserModuleKnowledgeModel.userId == user_id)
        .first()
    )
    if not umk:
        raise HTTPException(
            status_code=404, detail="UserModuleKnowledge not found")
    return umk
