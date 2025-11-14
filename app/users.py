from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session
from .db import get_db
from .auth import get_password_hash, verify_password, create_access_token
from .models import User as UserModelDecl, Role as RoleModel
from .models import Course as CourseModel, CourseEnrollment as CourseEnrollmentModel
from .utils import generate_unique_id
from .schemas import UserCreate, UserRead, CourseRead, CourseEnrollmentRead
from .deps import get_current_user, require_role

router = APIRouter(prefix='/users', tags=['users'])

class LoginIn(BaseModel):
    login: str
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = 'bearer'

class RoleUpdate(BaseModel):
    roleId: int

def get_user_model():
    return UserModelDecl


def _build_token_response(user: UserModelDecl, db: Session) -> TokenOut:
    role_name = None
    if getattr(user, 'roleId', None):
        r = db.get(RoleModel, user.roleId)
        if r:
            role_name = r.name

    payload = {
        'sub': str(user.id),
        'role_id': int(user.roleId) if getattr(user, 'roleId', None) is not None else None,
        'role': role_name,
        'login': user.login,
        'name': user.name,
        'surname': user.surname,
    }
    token = create_access_token(payload)
    return TokenOut(access_token=token)


def _authenticate_user(db: Session, login: str, password: str) -> UserModelDecl:
    user = db.query(UserModelDecl).filter(UserModelDecl.login == login).first()
    if not user or not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail='Bad credentials')
    return user

@router.post(
    '/register',
    summary='Зарегистрировать нового пользователя',
    description='Создает учетную запись студента с уникальным логином и хешированным паролем.',
)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    # use declarative model for clarity
    # ensure login is unique
    existing_login = db.query(UserModelDecl).filter(UserModelDecl.login == payload.login).first()
    if existing_login:
        raise HTTPException(status_code=400, detail='User exists')
    u = UserModelDecl()
    u.id = generate_unique_id(db, UserModelDecl)
    u.login = payload.login
    u.password = get_password_hash(payload.password)
    u.name = payload.name
    u.surname = payload.surname
    u.roleId = 1
    db.add(u)
    db.commit()
    return UserRead(id=u.id, login=u.login, name=u.name, surname=u.surname, roleId=u.roleId)

@router.post(
    '/login',
    response_model=TokenOut,
    summary='Войти по JSON-параметрам',
    description='Аутентифицирует пользователя по логину и паролю, возвращает JWT токен.',
)
def login(form: LoginIn, db: Session = Depends(get_db)):
    user = _authenticate_user(db, form.login, form.password)
    return _build_token_response(user, db)

@router.post(
    '/login-form',
    response_model=TokenOut,
    summary='Войти через form-data',
    description='Совместимый с OAuth2 endpoint, принимает данные формы и возвращает JWT токен.',
)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = _authenticate_user(db, form_data.username, form_data.password)
    return _build_token_response(user, db)

@router.post(
    '/logout',
    summary='Завершить сессию',
    description='Возвращает успешный ответ; фактическое удаление токена выполняется на клиенте.',
)
def logout(current=Depends(get_current_user)):
    return {'ok': True}

@router.get(
    '/me',
    response_model=UserRead,
    summary='Получить профиль текущего пользователя',
    description='Возвращает информацию о текущем аутентифицированном пользователе.',
)
def me(current=Depends(get_current_user)):
    return UserRead(id=current.id, login=current.login, name=current.name, surname=current.surname, roleId=current.roleId)

@router.get(
    '/me/courses/enrolled',
    response_model=list[CourseRead],
    summary='Список курсов, на которые пользователь записан',
    description='Возвращает опубликованные курсы, в которых текущий пользователь участвует как студент.',
)
def my_enrolled_courses(current=Depends(get_current_user), db: Session = Depends(get_db), limit: int = 20, offset: int = 0):
    # find enrollments
    q = db.query(CourseEnrollmentModel).filter(CourseEnrollmentModel.userId == int(current.id))
    enrollments = q.all()
    course_ids = [e.courseId for e in enrollments]
    if not course_ids:
        return []
    # only published courses
    courses = (
        db.query(CourseModel)
        .filter(CourseModel.id.in_(course_ids), CourseModel.isPublished == True)
        .offset(offset)
        .limit(limit)
        .all()
    )
    return courses


@router.get(
    '/me/enrollments',
    response_model=list[CourseEnrollmentRead],
    summary='Список записей на курсы текущего пользователя',
    description='Возвращает список CourseEnrollment для текущего пользователя (даты начала/окончания).',
)
def my_enrollments(current=Depends(get_current_user), db: Session = Depends(get_db)):
    uid = int(current.id)
    enrollments = db.query(CourseEnrollmentModel).filter(CourseEnrollmentModel.userId == uid).all()
    return enrollments

@router.get(
    '/me/courses/teaching',
    response_model=list[CourseRead],
    summary='Список курсов, которые ведет пользователь',
    description='Возвращает авторские курсы текущего пользователя.',
)
def my_teaching_courses(current=Depends(get_current_user), db: Session = Depends(get_db), limit: int = 20, offset: int = 0):
    courses = (
        db.query(CourseModel)
        .filter(CourseModel.authorId == int(current.id))
        .offset(offset)
        .limit(limit)
        .all()
    )
    return courses

@router.put(
    '/{user_id}/role',
    response_model=UserRead,
    summary='Изменить роль пользователя',
    description='Позволяет администратору обновить роль существующего пользователя.',
)
def update_user_role(
    user_id: int,
    payload: RoleUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(require_role('admin')),
):
    user = db.get(UserModelDecl, user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    role = db.get(RoleModel, payload.roleId)
    if not role:
        raise HTTPException(status_code=404, detail='Role not found')
    user.roleId = payload.roleId
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserRead(id=user.id, login=user.login, name=user.name, surname=user.surname, roleId=user.roleId)
