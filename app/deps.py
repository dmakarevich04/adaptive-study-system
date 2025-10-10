from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .db import get_db
from .models import User as UserModel, Role as RoleModel
from .auth import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/users/login-form')

class CurrentUser:
    def __init__(self, id: int, role_id: int | None, role: str | None, login: str | None, name: str | None, surname: str | None):
        self.id = id
        self.roleId = role_id
        self.role = role
        self.login = login
        self.name = name
        self.surname = surname

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> CurrentUser:
    payload = decode_token(token)
    if not payload or 'sub' not in payload:
        raise HTTPException(status_code=401, detail='Invalid token')
    user_id = int(payload['sub'])
    # Prefer token-contained info to avoid DB hits for common checks
    role_id = payload.get('role_id')
    role_name = payload.get('role')
    login = payload.get('login')
    name = payload.get('name')
    surname = payload.get('surname')

    # Basic verification: ensure user exists in DB
    user = db.get(UserModel, user_id)
    if not user:
        raise HTTPException(status_code=401, detail='User not found')

    # If token lacks role name but user has roleId, try to fetch role name
    if not role_name and getattr(user, 'roleId', None):
        r = db.get(RoleModel, user.roleId)
        role_name = r.name if r else None

    return CurrentUser(id=user_id, role_id=role_id or getattr(user, 'roleId', None), role=role_name, login=login or user.login, name=name or user.name, surname=surname or user.surname)

def require_role(role_name: str):
    def inner(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
        # Use role info from token/current_user first
        if current_user.role is not None:
            if current_user.role != role_name:
                raise HTTPException(status_code=403, detail='Insufficient role')
            return current_user

        # Fall back to DB lookup
        if current_user.roleId is None:
            raise HTTPException(status_code=403, detail='No role assigned')
        role = db.get(RoleModel, current_user.roleId)
        if not role or role.name != role_name:
            raise HTTPException(status_code=403, detail='Insufficient role')
        return current_user

    return inner
