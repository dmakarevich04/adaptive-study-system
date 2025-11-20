from fastapi import FastAPI
from .users import router as users_router
from .courses_full import router as courses_full_router
from .teaching import router as teaching_router

app = FastAPI(title='LMS Generic API')
app.include_router(users_router)
app.include_router(teaching_router)
app.include_router(courses_full_router)


@app.get('/')
def root():
    return {'ok': True}
