import os
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
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
)
from .utils import generate_unique_id

TEST_PASS_PERCENT = int(os.environ.get("TEST_PASS_PERCENT", "50"))
_max_attempts_env = os.environ.get("TEST_MAX_ATTEMPTS", "3")
TEST_MAX_ATTEMPTS = int(_max_attempts_env) if _max_attempts_env.isdigit() and int(_max_attempts_env) > 0 else None

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
    return db.query(TestResultModel).filter(TestResultModel.userId == uid).all()


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
            course_obj = db.get(CourseModel, module.courseId) if module else None
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
def submit_test(test_id: int, answers: dict[str, Any] | dict[int, Any], current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    uid = int(current_user.id)
    test = db.get(TestModel, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    course_id_for_check = None
    if test.courseId:
        course_id_for_check = test.courseId
    elif test.moduleId:
        module = db.get(ModuleModel, test.moduleId)
        if not module:
            raise HTTPException(status_code=404, detail="Module for test not found")
        course_id_for_check = module.courseId

    if course_id_for_check is not None:
        enrolled = (
            db.query(CourseEnrollmentModel)
            .filter(CourseEnrollmentModel.courseId == course_id_for_check, CourseEnrollmentModel.userId == uid)
            .first()
        )
        if not enrolled:
            raise HTTPException(status_code=403, detail="User is not enrolled in the course for this test")

    questions = db.query(QuestionModel).filter(QuestionModel.testId == test_id).all()
    total_questions = len(questions)
    if total_questions == 0:
        raise HTTPException(status_code=400, detail="Test has no questions")

    attempts_count = (
        db.query(TestResultModel)
        .filter(TestResultModel.testId == test_id, TestResultModel.userId == uid)
        .count()
    )
    if TEST_MAX_ATTEMPTS is not None and attempts_count >= TEST_MAX_ATTEMPTS:
        raise HTTPException(status_code=400, detail=f"Max attempts reached ({TEST_MAX_ATTEMPTS})")

    correct = 0
    for question in questions:
        provided: Any | None = None
        if isinstance(answers, dict):
            provided = answers.get(question.id)
            if provided is None:
                provided = answers.get(str(question.id))
        if provided is None:
            continue
        try:
            answer_id = int(provided)
        except Exception:
            continue
        answer = db.get(AnswerModel, answer_id)
        if answer and answer.questionId == question.id and answer.isCorrect:
            correct += 1

    percent = int((correct / total_questions) * 100)
    passed = percent >= TEST_PASS_PERCENT

    result = TestResultModel()
    result.scoreInPoints = correct
    result.isPassed = passed
    result.durationInMinutes = 0
    result.result = percent
    result.testId = test_id
    result.userId = uid
    db.add(result)
    db.commit()
    db.refresh(result)

    if test and test.moduleId:
        module_passed = (
            db.query(ModulePassedModel)
            .filter(ModulePassedModel.moduleId == test.moduleId, ModulePassedModel.userId == uid)
            .first()
        )
        if module_passed:
            if passed and not module_passed.isPassed:
                module_passed.isPassed = True
                db.add(module_passed)
                db.commit()
                db.refresh(module_passed)
        else:
            module_passed = ModulePassedModel()
            module_passed.moduleId = test.moduleId
            module_passed.isPassed = passed
            module_passed.userId = uid
            db.add(module_passed)
            db.commit()
            db.refresh(module_passed)

    return {
        "score": result.scoreInPoints,
        "percent": result.result,
        "passed": result.isPassed,
        "attempts": attempts_count + 1,
    }
