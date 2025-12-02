import os
import uuid
import shutil
import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from starlette.responses import FileResponse

from .db import get_db
from .deps import get_current_user, require_role
from .models import (
    Answer as AnswerModel,
    Course as CourseModel,
    CourseEnrollment as CourseEnrollmentModel,
    Module as ModuleModel,
    ModulePassed as ModulePassedModel,
    Question as QuestionModel,
    Test as TestModel,
    TestResult as TestResultModel,
    Topic as TopicModel,
    TopicContent as TopicContentModel,
)
from .schemas import (
    AnswerIn,
    AnswerRead,
    CourseIn,
    CourseOut,
    ModuleIn,
    ModuleOut,
    QuestionIn,
    QuestionRead,
    TestIn,
    TestOut,
    TestResultRead,
    TopicContentCreate,
    TopicContentRead,
    TopicCreate,
    TopicRead,
)
from .utils import generate_unique_id

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
COURSE_UPLOAD_DIR = os.path.join(UPLOAD_DIR, "courses")
os.makedirs(COURSE_UPLOAD_DIR, exist_ok=True)
TOPIC_UPLOAD_DIR = os.path.join(UPLOAD_DIR, "topics")
os.makedirs(TOPIC_UPLOAD_DIR, exist_ok=True)
QUESTIONS_UPLOAD_DIR = os.path.join(UPLOAD_DIR, "questions")
os.makedirs(QUESTIONS_UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/full", tags=["teaching"])

def _ensure_module_access(db: Session, course: CourseModel, module: ModuleModel, user_id: int) -> None:
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    if int(course.authorId) == user_id:
        return
    enrolled = (
        db.query(CourseEnrollmentModel)
        .filter(
            CourseEnrollmentModel.courseId == course.id,
            CourseEnrollmentModel.userId == user_id,
        )
        .first()
    )
    if not enrolled:
        raise HTTPException(status_code=403, detail="Not enrolled")
    modules = (
        db.query(ModuleModel)
        .filter(ModuleModel.courseId == course.id)
        .order_by(ModuleModel.id.asc())
        .all()
    )
    idx = next((i for i, m in enumerate(modules) if m.id == module.id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Module not found")
    if idx > 0:
        prev_module = modules[idx - 1]
        mp = (
            db.query(ModulePassedModel)
            .filter(
                ModulePassedModel.moduleId == prev_module.id,
                ModulePassedModel.userId == user_id,
                ModulePassedModel.isPassed == True,
            )
            .first()
        )
        if not mp:
            raise HTTPException(status_code=403, detail="Module locked")

@router.post(
    "/courses",
    response_model=CourseOut,
    summary="Создать новый курс",
    description="Создает черновик курса и привязывает его к текущему преподавателю.",
)
def create_course(
    payload: CourseIn,
    db: Session = Depends(get_db),
    current=Depends(require_role("teacher")),
):
    course = CourseModel()
    course.id = generate_unique_id(db, CourseModel)
    course.name = payload.name
    course.description = payload.description
    course.categoryId = payload.categoryId
    course.authorId = int(current.id)
    course.isPublished = False
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

@router.get(
    "/courses",
    response_model=list[CourseOut],
    summary="Получить список курсов",
    description="Возвращает курсы с возможностью фильтрации по статусу публикации, автору и категории.",
)
def list_courses(
    published: bool | None = None,
    authorId: int | None = None,
    categoryId: int | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    query = db.query(CourseModel)
    if published is not None:
        query = query.filter(CourseModel.isPublished == bool(published))
    if authorId is not None:
        query = query.filter(CourseModel.authorId == authorId)
    if categoryId is not None:
        query = query.filter(CourseModel.categoryId == categoryId)
    query = query.offset(offset).limit(limit)
    return query.all()

@router.get(
    "/courses/{course_id}",
    response_model=CourseOut,
    summary="Получить курс по идентификатору",
    description="Возвращает полную информацию о конкретном курсе по его идентификатору.",
)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.get(CourseModel, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.put(
    "/courses/{course_id}",
    response_model=CourseOut,
    summary="Обновить курс",
    description="Изменяет основные поля курса. Доступно только автору курса.",
)
def update_course(
    course_id: int,
    payload: CourseIn,
    db: Session = Depends(get_db),
    current=Depends(require_role("teacher")),
):
    course = db.get(CourseModel, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if int(current.id) != int(course.authorId):
        raise HTTPException(status_code=403, detail="Only author can modify course")
    course.name = payload.name
    course.description = payload.description
    course.categoryId = payload.categoryId
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

@router.delete(
    "/courses/{course_id}",
    summary="Удалить курс",
    description="Удаляет курс целиком. Доступно только автору курса.",
)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current=Depends(require_role("teacher")),
):
    course = db.get(CourseModel, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if int(current.id) != int(course.authorId):
        raise HTTPException(status_code=403, detail="Only author can delete course")
    db.delete(course)
    db.commit()
    return {"ok": True}

@router.patch(
    "/courses/{course_id}/publish",
    summary="Опубликовать или скрыть курс",
    description="Переключает флаг публикации курса. Доступно только автору курса.",
)
def publish_course(
    course_id: int,
    publish: bool,
    db: Session = Depends(get_db),
    current=Depends(require_role("teacher")),
):
    course = db.get(CourseModel, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if int(current.id) != int(course.authorId):
        raise HTTPException(status_code=403, detail="Only author can publish/unpublish")
    course.isPublished = bool(publish)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

@router.post(
    "/modules",
    response_model=ModuleOut,
    summary="Создать модуль",
    description="Добавляет новый модуль в существующий курс. Доступно только автору курса.",
)
def create_module(
    payload: ModuleIn,
    db: Session = Depends(get_db),
    current=Depends(require_role("teacher")),
):
    course = db.get(CourseModel, payload.courseId)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if int(current.id) != int(course.authorId):
        raise HTTPException(status_code=403, detail="Only author can add modules")
    module = ModuleModel()
    module.id = generate_unique_id(db, ModuleModel)
    module.name = payload.name
    module.description = payload.description
    module.courseId = payload.courseId
    db.add(module)
    db.commit()
    db.refresh(module)
    return module

@router.put(
    "/modules/{module_id}",
    response_model=ModuleOut,
    summary="Обновить модуль",
    description="Изменяет название и описание модуля. Доступно только автору курса.",
)
def update_module(
    module_id: int,
    payload: ModuleIn,
    db: Session = Depends(get_db),
    current=Depends(require_role("teacher")),
):
    module = db.get(ModuleModel, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    course = db.get(CourseModel, module.courseId)
    if int(current.id) != int(course.authorId):
        raise HTTPException(status_code=403, detail="Only author can modify module")
    module.name = payload.name
    module.description = payload.description
    db.add(module)
    db.commit()
    db.refresh(module)
    return module

@router.get(
    "/modules/{module_id}",
    response_model=ModuleOut,
    summary="Получить модуль по идентификатору",
    description="Возвращает данные модуля вместе с привязкой к курсу.",
)
def get_module(module_id: int, db: Session = Depends(get_db)):
    module = db.get(ModuleModel, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return module

@router.get(
    "/courses/{course_id}/modules",
    response_model=list[ModuleOut],
    summary="Перечислить модули курса",
    description="Возвращает все модули указанного курса в порядке их идентификаторов.",
)
def list_modules_for_course(course_id: int, db: Session = Depends(get_db)):
    return (
        db.query(ModuleModel)
        .filter(ModuleModel.courseId == course_id)
        .order_by(ModuleModel.id.asc())
        .all()
    )

@router.delete(
    "/modules/{module_id}",
    summary="Удалить модуль",
    description="Удаляет модуль и все связанные записи. Доступно только автору курса.",
)
def delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    current=Depends(require_role("teacher")),
):
    module = db.get(ModuleModel, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    course = db.get(CourseModel, module.courseId)
    if int(current.id) != int(course.authorId):
        raise HTTPException(status_code=403, detail="Only author can delete module")
    db.delete(module)
    db.commit()
    return {"ok": True}


@router.post(
    "/courses/{course_id}/picture",
    response_model=CourseOut,
    summary="Загрузить картинку курса",
    description="Загружает изображение для курса (только автор курса).",
)
def upload_course_picture(
    course_id: int,
    file: UploadFile,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    course = db.get(CourseModel, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    # Allow course author (teacher) or admin
    if not (getattr(current, "role", None) == "admin" or int(current.id) == int(course.authorId)):
        raise HTTPException(status_code=403, detail="Only author or admin can upload picture")
    if not file or not getattr(file, "filename", None):
        raise HTTPException(status_code=400, detail="No file provided")

    # generate unique filename preserving extension
    _, ext = os.path.splitext(file.filename)
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(COURSE_UPLOAD_DIR, filename)
    try:
        with open(dest_path, "wb") as out_f:
            shutil.copyfileobj(file.file, out_f)
    finally:
        try:
            file.file.close()
        except Exception:
            pass

    # remove old picture file if present
    try:
        if course.picture:
            old_path = course.picture
            # stored paths are like '/uploads/courses/<name>' or absolute; try to resolve
            if old_path.startswith("/uploads/"):
                old_full = os.path.join(os.path.dirname(__file__), "..", old_path.lstrip("/"))
            else:
                old_full = old_path
            if os.path.exists(old_full):
                os.remove(old_full)
    except Exception:
        pass

    # store a web-friendly path
    course.picture = f"/uploads/courses/{filename}"
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.delete(
    "/courses/{course_id}/picture",
    summary="Удалить картинку курса",
    description="Удаляет картинку курса (только автор курса).",
)
def delete_course_picture(
    course_id: int,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    course = db.get(CourseModel, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    # Allow course author (teacher) or admin
    if not (getattr(current, "role", None) == "admin" or int(current.id) == int(course.authorId)):
        raise HTTPException(status_code=403, detail="Only author or admin can delete picture")
    if not course.picture:
        return {"ok": True}
    try:
        if course.picture.startswith("/uploads/"):
            full = os.path.join(os.path.dirname(__file__), "..", course.picture.lstrip("/"))
        else:
            full = course.picture
        if os.path.exists(full):
            os.remove(full)
    except Exception:
        pass
    course.picture = None
    db.add(course)
    db.commit()
    return {"ok": True}


@router.get(
    "/uploads/courses/{filename}",
    summary="Отдать картинку курса",
    description="Возвращает файл картинки курса по имени.",
)
def serve_course_picture(filename: str):
    full = os.path.join(COURSE_UPLOAD_DIR, filename)
    if not os.path.exists(full):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(full, filename=filename)


@router.get(
    "/uploads/questions/{filename}",
    summary="Отдать картинку вопроса по имени",
    description="Возвращает файл картинки вопроса по имени.",
)
def serve_question_file(filename: str):
    full = os.path.join(QUESTIONS_UPLOAD_DIR, filename)
    if not os.path.exists(full):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(full, filename=filename)


@router.get(
    "/courses/{course_id}/picture",
    summary="Получить картинку курса по id",
    description="Возвращает файл картинки, привязанной к курсу (по id курса).",
)
def get_course_picture(course_id: int, db: Session = Depends(get_db)):
    course = db.get(CourseModel, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not course.picture:
        raise HTTPException(status_code=404, detail="Course has no picture")
    # resolve stored path to filesystem
    try:
        if course.picture.startswith("/uploads/"):
            full = os.path.join(os.path.dirname(__file__), "..", course.picture.lstrip("/"))
        else:
            full = course.picture
        if not os.path.exists(full):
            raise HTTPException(status_code=404, detail="File not found")
        filename = os.path.basename(full)
        return FileResponse(full, filename=filename)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error serving file")


@router.post(
    "/questions/{question_id}/picture",
    response_model=QuestionRead,
    summary="Загрузить картинку для вопроса",
    description="Загружает файл изображения для вопроса (author или admin).",
)
def upload_question_picture(
    question_id: int,
    file: UploadFile,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    question = db.get(QuestionModel, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    test = db.get(TestModel, question.testId)
    course_obj = None
    if test:
        if test.courseId:
            course_obj = db.get(CourseModel, test.courseId)
        elif test.moduleId:
            module = db.get(ModuleModel, test.moduleId)
            course_obj = db.get(CourseModel, module.courseId) if module else None
    # allow author or admin
    if course_obj and not (getattr(current, "role", None) == "admin" or int(current.id) == int(course_obj.authorId)):
        raise HTTPException(status_code=403, detail="Only author or admin can upload question picture")
    if not file or not getattr(file, "filename", None):
        raise HTTPException(status_code=400, detail="No file provided")

    _, ext = os.path.splitext(file.filename)
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(QUESTIONS_UPLOAD_DIR, filename)
    try:
        with open(dest_path, "wb") as out_f:
            shutil.copyfileobj(file.file, out_f)
    finally:
        try:
            file.file.close()
        except Exception:
            pass

    # remove old file if present
    try:
        if question.picture:
            old_path = question.picture
            if old_path.startswith("/uploads/"):
                old_full = os.path.join(os.path.dirname(__file__), "..", old_path.lstrip("/"))
            else:
                old_full = old_path
            if os.path.exists(old_full):
                os.remove(old_full)
    except Exception:
        pass

    question.picture = f"/uploads/questions/{filename}"
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.delete(
    "/questions/{question_id}/picture",
    summary="Удалить картинку вопроса",
    description="Удаляет картинку вопроса (author или admin).",
)
def delete_question_picture(
    question_id: int,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    question = db.get(QuestionModel, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    test = db.get(TestModel, question.testId)
    course_obj = None
    if test:
        if test.courseId:
            course_obj = db.get(CourseModel, test.courseId)
        elif test.moduleId:
            module = db.get(ModuleModel, test.moduleId)
            course_obj = db.get(CourseModel, module.courseId) if module else None
    # allow author or admin
    if course_obj and not (getattr(current, "role", None) == "admin" or int(current.id) == int(course_obj.authorId)):
        raise HTTPException(status_code=403, detail="Only author or admin can delete question picture")
    if not question.picture:
        return {"ok": True}
    try:
        if question.picture.startswith("/uploads/"):
            full = os.path.join(os.path.dirname(__file__), "..", question.picture.lstrip("/"))
        else:
            full = question.picture
        if os.path.exists(full):
            os.remove(full)
    except Exception:
        pass
    question.picture = None
    db.add(question)
    db.commit()
    return {"ok": True}


@router.get(
    "/questions/{question_id}/picture",
    summary="Получить картинку вопроса по id",
    description="Возвращает картинку, привязанную к вопросу.",
)
def get_question_picture(question_id: int, db: Session = Depends(get_db)):
    question = db.get(QuestionModel, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    if not question.picture:
        raise HTTPException(status_code=404, detail="Question has no picture")
    try:
        if question.picture.startswith("/uploads/"):
            full = os.path.join(os.path.dirname(__file__), "..", question.picture.lstrip("/"))
        else:
            full = question.picture
        if not os.path.exists(full):
            raise HTTPException(status_code=404, detail="File not found")
        filename = os.path.basename(full)
        return FileResponse(full, filename=filename)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error serving file")

@router.post(
    "/topics",
    response_model=TopicRead,
    summary="Создать тему",
    description="Добавляет тему в выбранный модуль. Доступно только автору курса.",
)
def create_topic(
    payload: TopicCreate,
    db: Session = Depends(get_db),
    current=Depends(require_role("teacher")),
):
    module = db.get(ModuleModel, payload.moduleId)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    course = db.get(CourseModel, module.courseId) if module else None
    if course and int(current.id) != int(course.authorId):
        raise HTTPException(status_code=403, detail="Only author can create topic")
    topic = TopicModel()
    topic.id = generate_unique_id(db, TopicModel)
    topic.name = payload.name
    topic.description = payload.description
    topic.moduleId = payload.moduleId
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic

@router.get(
    "/topics/{topic_id}",
    response_model=TopicRead,
    summary="Получить тему",
    description="Возвращает тему с проверкой доступа для студентов и авторов.",
)
def get_topic(topic_id: int, current=Depends(get_current_user), db: Session = Depends(get_db)):
    topic = db.get(TopicModel, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    module = db.get(ModuleModel, topic.moduleId)
    course = db.get(CourseModel, module.courseId) if module else None
    uid = int(current.id)
    if course:
        if int(current.id) != int(course.authorId):
            enrolled = (
                db.query(CourseEnrollmentModel)
                .filter(
                    CourseEnrollmentModel.courseId == course.id,
                    CourseEnrollmentModel.userId == uid,
                )
                .first()
            )
            if not enrolled:
                raise HTTPException(status_code=403, detail="Not enrolled")
            modules = (
                db.query(ModuleModel)
                .filter(ModuleModel.courseId == course.id)
                .order_by(ModuleModel.id.asc())
                .all()
            )
            idx = next((i for i, m in enumerate(modules) if m.id == module.id), None)
            if idx is None:
                raise HTTPException(status_code=404, detail="Module not found")
            if idx > 0:
                prev_module = modules[idx - 1]
                mp = (
                    db.query(ModulePassedModel)
                    .filter(
                        ModulePassedModel.moduleId == prev_module.id,
                        ModulePassedModel.userId == uid,
                        ModulePassedModel.isPassed == True,
                    )
                    .first()
                )
                if not mp:
                    raise HTTPException(status_code=403, detail="Module locked")
    return topic

@router.put(
    "/topics/{topic_id}",
    response_model=TopicRead,
    summary="Обновить тему",
    description="Редактирует название и описание темы. Доступно только автору курса.",
)
def update_topic(
    topic_id: int,
    payload: TopicCreate,
    db: Session = Depends(get_db),
    current=Depends(require_role("teacher")),
):
    topic = db.get(TopicModel, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    module = db.get(ModuleModel, topic.moduleId)
    course = db.get(CourseModel, module.courseId) if module else None
    if course and int(current.id) != int(course.authorId):
        raise HTTPException(status_code=403, detail="Only author can modify topic")
    topic.name = payload.name
    topic.description = payload.description
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic

@router.delete(
    "/topics/{topic_id}",
    summary="Удалить тему",
    description="Удаляет тему и связанные материалы. Доступно только автору курса.",
)
def delete_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current=Depends(require_role("teacher")),
):
    topic = db.get(TopicModel, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    module = db.get(ModuleModel, topic.moduleId)
    course = db.get(CourseModel, module.courseId) if module else None
    if course and int(current.id) != int(course.authorId):
        raise HTTPException(status_code=403, detail="Only author can delete topic")
    contents = db.query(TopicContentModel).filter(TopicContentModel.topicId == topic.id).all()
    for content in contents:
        try:
            if content.file and os.path.exists(content.file):
                os.remove(content.file)
        except Exception:
            pass
        db.delete(content)
    db.delete(topic)
    db.commit()
    return {"ok": True}

@router.get(
    "/courses/{course_id}/modules/{module_id}/topics",
    response_model=list[TopicRead],
    summary="Список тем модуля",
    description="Возвращает темы модуля с проверкой доступа и прогресса студента.",
)
def list_topics(
    course_id: int,
    module_id: int,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    course = db.get(CourseModel, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    module = db.get(ModuleModel, module_id)
    if not module or int(module.courseId) != int(course.id):
        raise HTTPException(status_code=404, detail="Module not found")

    is_author = int(course.authorId) == int(current.id)

    if not is_author:
        enrolled = (
            db.query(CourseEnrollmentModel)
            .filter(
                CourseEnrollmentModel.courseId == course_id,
                CourseEnrollmentModel.userId == int(current.id),
            )
            .first()
        )
        if not enrolled:
            raise HTTPException(status_code=403, detail="Not enrolled")

        modules = (
            db.query(ModuleModel)
            .filter(ModuleModel.courseId == course_id)
            .order_by(ModuleModel.id.asc())
            .all()
        )
        idx = next((i for i, m in enumerate(modules) if m.id == module_id), None)
        if idx is None:
            raise HTTPException(status_code=404, detail="Module not found")
        if idx > 0:
            prev_module = modules[idx - 1]
            mp = (
                db.query(ModulePassedModel)
                .filter(
                    ModulePassedModel.moduleId == prev_module.id,
                    ModulePassedModel.userId == int(current.id),
                    ModulePassedModel.isPassed == True,
                )
                .first()
            )
            if not mp:
                raise HTTPException(status_code=403, detail="Module locked")

    topics = db.query(TopicModel).filter(TopicModel.moduleId == module_id).all()
    return topics

@router.get(
    "/topic-contents/{content_id}",
    response_model=TopicContentRead,
    summary="Получить материал темы",
    description="Возвращает метаданные материала темы с проверкой доступа.",
)
def get_topic_content(
    content_id: int,
    course_id: int | None = None,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    topic_content = db.get(TopicContentModel, content_id)
    if not topic_content:
        raise HTTPException(status_code=404, detail="TopicContent not found")
    topic = db.get(TopicModel, topic_content.topicId)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    module = db.get(ModuleModel, topic.moduleId)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    course_obj = db.get(CourseModel, module.courseId) if module else None
    if not course_obj:
        raise HTTPException(status_code=404, detail="Course not found")
    if course_id is not None and int(course_id) != int(course_obj.id):
        raise HTTPException(status_code=400, detail="Course mismatch for content")
    _ensure_module_access(db, course_obj, module, int(current.id))
    return topic_content

@router.get(
    "/topic-contents/{content_id}/download",
    summary="Скачать файл материала",
    description="Отдает файл материала темы после проверки прав доступа.",
)
def download_topic_content(
    content_id: int,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    topic_content = db.get(TopicContentModel, content_id)
    if not topic_content:
        raise HTTPException(status_code=404, detail="TopicContent not found")
    topic = db.get(TopicModel, topic_content.topicId)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    module = db.get(ModuleModel, topic.moduleId)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    course = db.get(CourseModel, module.courseId) if module else None
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    _ensure_module_access(db, course, module, int(current.id))
    if not topic_content.file or not os.path.exists(topic_content.file):
        raise HTTPException(status_code=404, detail="File not found")
    filename = os.path.basename(topic_content.file)
    return FileResponse(topic_content.file, filename=filename)

@router.put(
    "/topic-contents/{content_id}",
    response_model=TopicContentRead,
    summary="Обновить материал темы",
    description="Изменяет описание материала темы. Доступно только автору курса.",
)
def update_topic_content(
    content_id: int,
    payload: TopicContentCreate,
    db: Session = Depends(get_db),
    current=Depends(require_role("teacher")),
):
    topic_content = db.get(TopicContentModel, content_id)
    if not topic_content:
        raise HTTPException(status_code=404, detail="TopicContent not found")
    topic = db.get(TopicModel, topic_content.topicId)
    module = db.get(ModuleModel, topic.moduleId) if topic else None
    course = db.get(CourseModel, module.courseId) if module else None
    if course and int(current.id) != int(course.authorId):
        raise HTTPException(status_code=403, detail="Only author can modify content")
    topic_content.description = payload.description
    db.add(topic_content)
    db.commit()
    db.refresh(topic_content)
    return topic_content

@router.delete(
    "/topic-contents/{content_id}",
    summary="Удалить материал темы",
    description="Удаляет материал и связанный файл. Доступно только автору курса.",
)
def delete_topic_content(
    content_id: int,
    db: Session = Depends(get_db),
    current=Depends(require_role("teacher")),
):
    topic_content = db.get(TopicContentModel, content_id)
    if not topic_content:
        raise HTTPException(status_code=404, detail="TopicContent not found")
    topic = db.get(TopicModel, topic_content.topicId)
    module = db.get(ModuleModel, topic.moduleId) if topic else None
    course = db.get(CourseModel, module.courseId) if module else None
    if course and int(current.id) != int(course.authorId):
        raise HTTPException(status_code=403, detail="Only author can delete content")
    try:
        if topic_content.file:
            # topic content stores filesystem path; remove if exists
            try:
                if os.path.exists(topic_content.file):
                    os.remove(topic_content.file)
            except Exception:
                pass
    except Exception:
        pass
    db.delete(topic_content)
    db.commit()
    return {"ok": True}


@router.post(
    "/topic-contents",
    response_model=TopicContentRead,
    summary="Создать материал темы (загрузка файла)",
    description="Загружает файл материала и создаёт запись TopicContent. Только автор курса.",
)
def create_topic_content(
    topicId: int,
    description: str | None = None,
    file: UploadFile | None = None,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    # validate topic
    topic = db.get(TopicModel, topicId)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    module = db.get(ModuleModel, topic.moduleId)
    course = db.get(CourseModel, module.courseId) if module else None
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    # allow course author or admin
    if not (getattr(current, "role", None) == "admin" or int(current.id) == int(course.authorId)):
        raise HTTPException(status_code=403, detail="Only author or admin can create content for this topic")

    if not file or not getattr(file, "filename", None):
        raise HTTPException(status_code=400, detail="No file provided")

    # save file
    _, ext = os.path.splitext(file.filename)
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(TOPIC_UPLOAD_DIR, filename)
    # ensure directory exists and is writable
    try:
        dest_dir = os.path.dirname(dest_path)
        os.makedirs(dest_dir, exist_ok=True)
    except PermissionError:
        logging.exception("Permission denied while creating upload directory: %s", os.path.dirname(dest_path))
        raise HTTPException(status_code=500, detail="Server permission error: cannot create upload directory")
    except Exception:
        logging.exception("Failed to ensure upload directory exists: %s", os.path.dirname(dest_path))
        raise HTTPException(status_code=500, detail="Server error while preparing upload directory")

    # Diagnostics: log directory ownership/mode and process uid/gid, attempt to adjust perms
    try:
        try:
            stat = os.stat(dest_dir)
            logging.info(
                "Upload dir stat: %s uid=%s gid=%s mode=%o",
                dest_dir,
                stat.st_uid,
                stat.st_gid,
                stat.st_mode & 0o777,
            )
        except Exception:
            logging.exception("Failed to stat upload directory: %s", dest_dir)

        try:
            proc_uid = os.geteuid()
            proc_gid = os.getegid()
            logging.info("Process euid/egid: %s/%s", proc_uid, proc_gid)
        except Exception:
            logging.exception("Failed to get process uid/gid")

        # Try to set directory permissions to 775 to help containerized / shared mounts
        try:
            os.chmod(dest_dir, 0o775)
            logging.info("Attempted to set chmod 775 on %s", dest_dir)
        except PermissionError:
            logging.warning("Permission denied when attempting chmod on %s", dest_dir)
        except Exception:
            logging.exception("Unexpected error during chmod on %s", dest_dir)
    except Exception:
        logging.exception("Unexpected diagnostics failure for upload dir: %s", dest_dir)

    try:
        with open(dest_path, "wb") as out_f:
            shutil.copyfileobj(file.file, out_f)
    except PermissionError:
        logging.exception("Permission denied when writing uploaded file to: %s", dest_path)
        # ensure we don't leave a partial file
        try:
            if os.path.exists(dest_path):
                os.remove(dest_path)
        except Exception:
            logging.exception("Failed to remove partial uploaded file: %s", dest_path)
        raise HTTPException(status_code=500, detail="Server permission error while saving uploaded file")
    except Exception:
        logging.exception("Failed to save uploaded file to: %s", dest_path)
        try:
            if os.path.exists(dest_path):
                os.remove(dest_path)
        except Exception:
            logging.exception("Failed to remove partial uploaded file after error: %s", dest_path)
        raise HTTPException(status_code=500, detail="Server error while saving uploaded file")
    finally:
        try:
            file.file.close()
        except Exception:
            pass

    # create DB record; store filesystem path (used by download/delete endpoints)
    tc = TopicContentModel()
    tc.id = generate_unique_id(db, TopicContentModel)
    tc.description = description or ""
    tc.file = dest_path
    tc.topicId = topicId
    db.add(tc)
    db.commit()
    db.refresh(tc)
    return tc

@router.get(
    "/topics/{topic_id}/contents",
    response_model=list[TopicContentRead],
    summary="Перечислить материалы темы",
    description="Возвращает список материалов темы с проверкой доступа.",
)
def get_topic_contents(
    topic_id: int,
    course_id: int | None = None,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    topic = db.get(TopicModel, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    module = db.get(ModuleModel, topic.moduleId)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    course = db.get(CourseModel, module.courseId) if module else None
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course_id is not None and int(course_id) != int(course.id):
        raise HTTPException(status_code=400, detail="Course mismatch for topic")
    _ensure_module_access(db, course, module, int(current.id))
    contents = db.query(TopicContentModel).filter(TopicContentModel.topicId == topic_id).all()
    return contents

@router.post(
    "/tests",
    response_model=TestOut,
    summary="Создать тест",
    description="Создает тест на уровне курса или модуля с проверкой уникальности и прав доступа.",
)
def create_test(
    payload: TestIn,
    db: Session = Depends(get_db),
    current=Depends(require_role("teacher")),
):
    module_id = getattr(payload, "moduleId", None)
    course_id = getattr(payload, "courseId", None)
    if module_id is not None and course_id is not None:
        raise HTTPException(status_code=400, detail="Test must belong to either module or course")
    if module_id is None and course_id is None:
        raise HTTPException(status_code=400, detail="Test must specify module or course")
    if module_id is not None:
        pass
    if course_id is not None:
        pass
    if module_id is not None:
        module = db.get(ModuleModel, module_id)
        if not module:
            raise HTTPException(status_code=404, detail="Module not found")
        course = db.get(CourseModel, module.courseId)
        if int(current.id) != int(course.authorId):
            raise HTTPException(status_code=403, detail="Only author can create test for module")
    if course_id is not None:
        course = db.get(CourseModel, course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        if int(current.id) != int(course.authorId):
            raise HTTPException(status_code=403, detail="Only author can create test for course")
    test = TestModel()
    test.id = generate_unique_id(db, TestModel)
    test.name = payload.name
    test.description = payload.description
    test.durationInMinutes = payload.durationInMinutes
    test.moduleId = module_id
    test.courseId = course_id
    db.add(test)
    db.commit()
    db.refresh(test)
    return test

@router.get(
    "/tests/{test_id}",
    response_model=TestOut,
    summary="Получить тест",
    description="Возвращает тест по идентификатору.",
)
def get_test(test_id: int, db: Session = Depends(get_db)):
    test = db.get(TestModel, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    return test

@router.get(
    "/tests",
    response_model=list[TestOut],
    summary="Список тестов",
    description="Возвращает тесты с фильтрами по курсу и модулю.",
)
def list_tests(
    course_id: int | None = None,
    module_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(TestModel)
    if course_id is not None:
        query = query.filter(TestModel.courseId == course_id)
    if module_id is not None:
        query = query.filter(TestModel.moduleId == module_id)
    return query.all()

@router.get(
    "/tests/{test_id}/results",
    response_model=list[TestResultRead],
    summary="Результаты теста",
    description="Перечисляет результаты прохождения теста для администратора или автора курса.",
)
def list_results_for_test(
    test_id: int,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    test = db.get(TestModel, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    uid = int(current.id)
    if current.role == "admin":
        return db.query(TestResultModel).filter(TestResultModel.testId == test_id).order_by(TestResultModel.created_at.desc()).all()
    course_obj = None
    if test.courseId:
        course_obj = db.get(CourseModel, test.courseId)
    elif test.moduleId:
        module = db.get(ModuleModel, test.moduleId)
        course_obj = db.get(CourseModel, module.courseId) if module else None
    if course_obj and int(course_obj.authorId) == uid:
        return db.query(TestResultModel).filter(TestResultModel.testId == test_id).order_by(TestResultModel.created_at.desc()).all()
    raise HTTPException(status_code=403, detail="Not authorized")

@router.put(
    "/tests/{test_id}",
    response_model=TestOut,
    dependencies=[Depends(require_role("teacher"))],
    summary="Обновить тест",
    description="Редактирует параметры теста и проверяет сохраняемую привязку к курсу или модулю.",
)
def update_test(
    test_id: int,
    payload: TestIn,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    test = db.get(TestModel, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    module_id = getattr(payload, "moduleId", None)
    course_id = getattr(payload, "courseId", None)
    if module_id is not None and course_id is not None:
        raise HTTPException(status_code=400, detail="Test must belong to either module or course")
    if module_id is None and course_id is None:
        raise HTTPException(status_code=400, detail="Test must specify module or course")
    course_for_test = None
    if module_id is not None:
        module = db.get(ModuleModel, module_id)
        if not module:
            raise HTTPException(status_code=404, detail="Module not found")
        course_for_test = db.get(CourseModel, module.courseId)
        if not course_for_test:
            raise HTTPException(status_code=404, detail="Course not found")
        if int(current.id) != int(course_for_test.authorId):
            raise HTTPException(status_code=403, detail="Only author can modify test")
    if course_id is not None:
        course_for_test = db.get(CourseModel, course_id)
        if not course_for_test:
            raise HTTPException(status_code=404, detail="Course not found")
        if int(current.id) != int(course_for_test.authorId):
            raise HTTPException(status_code=403, detail="Only author can modify test")
    test.name = payload.name
    test.description = payload.description
    test.durationInMinutes = payload.durationInMinutes
    test.moduleId = module_id
    test.courseId = course_id
    db.add(test)
    db.commit()
    db.refresh(test)
    return test

@router.delete(
    "/tests/{test_id}",
    dependencies=[Depends(require_role("teacher"))],
    summary="Удалить тест",
    description="Удаляет тест. Доступно только автору соответствующего курса.",
)
def delete_test(
    test_id: int,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    test = db.get(TestModel, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    course_for_test = None
    if test.courseId:
        course_for_test = db.get(CourseModel, test.courseId)
    elif test.moduleId:
        module = db.get(ModuleModel, test.moduleId)
        course_for_test = db.get(CourseModel, module.courseId) if module else None
    if course_for_test and int(current.id) != int(course_for_test.authorId):
        raise HTTPException(status_code=403, detail="Only author can delete test")
    db.delete(test)
    db.commit()
    return {"ok": True}

@router.get(
    "/questions/{question_id}",
    response_model=QuestionRead,
    summary="Получить вопрос",
    description="Возвращает вопрос теста по идентификатору.",
)
def get_question(question_id: int, db: Session = Depends(get_db)):
    question = db.get(QuestionModel, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question

@router.get(
    "/tests/{test_id}/questions",
    response_model=list[QuestionRead],
    summary="Перечислить вопросы теста",
    description="Возвращает все вопросы указанного теста.",
)
def list_questions(test_id: int, db: Session = Depends(get_db)):
    return db.query(QuestionModel).filter(QuestionModel.testId == test_id).all()

@router.post(
    "/questions",
    response_model=QuestionRead,
    summary="Создать вопрос",
    description="Добавляет вопрос к тесту. Доступно только автору курса.",
)
def create_question(
    payload: QuestionIn,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    test = db.get(TestModel, payload.testId)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    owner_course = None
    if test.courseId:
        owner_course = db.get(CourseModel, test.courseId)
    elif test.moduleId:
        module = db.get(ModuleModel, test.moduleId)
        owner_course = db.get(CourseModel, module.courseId)
    # allow course author or admin
    if owner_course and not (getattr(current, "role", None) == "admin" or int(current.id) == int(owner_course.authorId)):
        raise HTTPException(status_code=403, detail="Only author or admin can add questions")
    question = QuestionModel()
    question.id = generate_unique_id(db, QuestionModel)
    question.text = payload.text
    question.complexityPoints = payload.complexityPoints
    question.testId = payload.testId
    # set topic if provided
    if getattr(payload, 'topicId', None) is not None:
        question.topicId = payload.topicId
    # optional fields
    try:
        question.questionType = payload.questionType
    except Exception:
        question.questionType = 'test'
    try:
        question.picture = payload.picture
    except Exception:
        question.picture = None
    db.add(question)
    db.commit()
    db.refresh(question)
    return question

@router.put(
    "/questions/{question_id}",
    response_model=QuestionRead,
    summary="Обновить вопрос",
    description="Редактирует текст и сложность вопроса. Доступно только автору курса.",
)
def update_question(
    question_id: int,
    payload: QuestionIn,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    question = db.get(QuestionModel, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    test = db.get(TestModel, question.testId)
    owner_course = None
    if test:
        if test.courseId:
            owner_course = db.get(CourseModel, test.courseId)
        elif test.moduleId:
            module = db.get(ModuleModel, test.moduleId)
            owner_course = db.get(CourseModel, module.courseId) if module else None
    # allow course author or admin
    if owner_course and not (getattr(current, "role", None) == "admin" or int(current.id) == int(owner_course.authorId)):
        raise HTTPException(status_code=403, detail="Only author or admin can modify question")
    question.text = payload.text
    question.complexityPoints = payload.complexityPoints
    # allow updating questionType and picture
    if hasattr(payload, 'questionType'):
        question.questionType = payload.questionType
    if hasattr(payload, 'picture'):
        question.picture = payload.picture
    # allow updating topicId (may be None)
    if hasattr(payload, 'topicId'):
        question.topicId = payload.topicId
    db.add(question)
    db.commit()
    db.refresh(question)
    return question

@router.delete(
    "/questions/{question_id}",
    summary="Удалить вопрос",
    description="Удаляет вопрос теста. Доступно только автору курса.",
)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    question = db.get(QuestionModel, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    test = db.get(TestModel, question.testId)
    owner_course = None
    if test:
        if test.courseId:
            owner_course = db.get(CourseModel, test.courseId)
        elif test.moduleId:
            module = db.get(ModuleModel, test.moduleId)
            owner_course = db.get(CourseModel, module.courseId) if module else None
    # allow course author or admin
    if owner_course and not (getattr(current, "role", None) == "admin" or int(current.id) == int(owner_course.authorId)):
        raise HTTPException(status_code=403, detail="Only author or admin can delete question")
    db.delete(question)
    db.commit()
    return {"ok": True}

@router.get(
    "/answers/{answer_id}",
    response_model=AnswerRead,
    summary="Получить ответ",
    description="Возвращает ответ по идентификатору.",
)
def get_answer(answer_id: int, db: Session = Depends(get_db)):
    answer = db.get(AnswerModel, answer_id)
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    return answer

@router.get(
    "/questions/{question_id}/answers",
    response_model=list[AnswerRead],
    summary="Перечислить ответы вопроса",
    description="Возвращает все ответы конкретного вопроса.",
)
def list_answers(question_id: int, db: Session = Depends(get_db)):
    return db.query(AnswerModel).filter(AnswerModel.questionId == question_id).all()

@router.post(
    "/answers",
    response_model=AnswerRead,
    summary="Создать ответ",
    description="Добавляет новый вариант ответа к вопросу теста. Доступно только автору курса.",
)
def create_answer(
    payload: AnswerIn,
    db: Session = Depends(get_db),
    current=Depends(require_role("teacher")),
):
    question = db.get(QuestionModel, payload.questionId)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    test = db.get(TestModel, question.testId)
    owner_course = None
    if test:
        if test.courseId:
            owner_course = db.get(CourseModel, test.courseId)
        elif test.moduleId:
            module = db.get(ModuleModel, test.moduleId)
            owner_course = db.get(CourseModel, module.courseId)
    if owner_course and int(current.id) != int(owner_course.authorId):
        raise HTTPException(status_code=403, detail="Only author can add answers")
    answer = AnswerModel()
    answer.id = generate_unique_id(db, AnswerModel)
    answer.isCorrect = payload.isCorrect
    answer.text = payload.text
    answer.questionId = payload.questionId
    db.add(answer)
    db.commit()
    db.refresh(answer)
    return answer

@router.put(
    "/answers/{answer_id}",
    response_model=AnswerRead,
    dependencies=[Depends(require_role("teacher"))],
    summary="Обновить ответ",
    description="Изменяет текст и правильность ответа. Доступно только автору курса.",
)
def update_answer(
    answer_id: int,
    payload: AnswerIn,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    answer = db.get(AnswerModel, answer_id)
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    question = db.get(QuestionModel, answer.questionId)
    test = db.get(TestModel, question.testId) if question else None
    owner_course = None
    if test:
        if test.courseId:
            owner_course = db.get(CourseModel, test.courseId)
        elif test.moduleId:
            module = db.get(ModuleModel, test.moduleId)
            owner_course = db.get(CourseModel, module.courseId) if module else None
    if owner_course and int(current.id) != int(owner_course.authorId):
        raise HTTPException(status_code=403, detail="Only author can modify answer")
    answer.text = payload.text
    answer.isCorrect = payload.isCorrect
    db.add(answer)
    db.commit()
    db.refresh(answer)
    return answer

@router.delete(
    "/answers/{answer_id}",
    dependencies=[Depends(require_role("teacher"))],
    summary="Удалить ответ",
    description="Удаляет вариант ответа из вопроса теста. Доступно только автору курса.",
)
def delete_answer(
    answer_id: int,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    answer = db.get(AnswerModel, answer_id)
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    question = db.get(QuestionModel, answer.questionId)
    test = db.get(TestModel, question.testId) if question else None
    owner_course = None
    if test:
        if test.courseId:
            owner_course = db.get(CourseModel, test.courseId)
        elif test.moduleId:
            module = db.get(ModuleModel, test.moduleId)
            owner_course = db.get(CourseModel, module.courseId) if module else None
    if owner_course and int(current.id) != int(owner_course.authorId):
        raise HTTPException(status_code=403, detail="Only author can delete answer")
    db.delete(answer)
    db.commit()
    return {"ok": True}
