from pydantic import BaseModel, ConfigDict
from typing import Optional

class UserCreate(BaseModel):
    login: str
    password: str
    name: str
    surname: str

class UserRead(BaseModel):
    id: int
    login: str
    name: str
    surname: str
    roleId: Optional[int]

    model_config = ConfigDict(from_attributes=True)

class CourseCreate(BaseModel):
    name: str
    description: str
    categoryId: Optional[int]
    authorId: Optional[int]

class CourseRead(BaseModel):
    id: int
    name: str
    description: str
    categoryId: Optional[int]
    authorId: Optional[int]
    isPublished: bool

    model_config = ConfigDict(from_attributes=True)

class ModuleCreate(BaseModel):
    name: str
    description: str
    courseId: int

class ModuleRead(BaseModel):
    id: int
    name: str
    description: str
    courseId: int

    model_config = ConfigDict(from_attributes=True)

class TopicCreate(BaseModel):
    name: str
    description: str
    moduleId: int

class TopicRead(BaseModel):
    id: int
    name: str
    description: str
    moduleId: int

    model_config = ConfigDict(from_attributes=True)

class TestCreate(BaseModel):
    name: str
    description: str
    durationInMinutes: int
    moduleId: Optional[int] = None
    courseId: Optional[int] = None

class TestRead(BaseModel):
    id: int
    name: str
    description: str
    durationInMinutes: int
    moduleId: Optional[int] = None
    courseId: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class QuestionCreate(BaseModel):
    text: str
    complexityPoints: int
    testId: int


class QuestionRead(BaseModel):
    id: int
    text: str
    picture: Optional[str]
    complexityPoints: int
    testId: int

    model_config = ConfigDict(from_attributes=True)

class AnswerCreate(BaseModel):
    isCorrect: bool
    text: str
    questionId: int

class AnswerRead(BaseModel):
    id: int
    isCorrect: bool
    text: str
    questionId: int

    model_config = ConfigDict(from_attributes=True)

class TestResultCreate(BaseModel):
    scoreInPoints: int
    isPassed: bool
    durationInMinutes: int
    result: int
    testId: int
    userId: int

class TestResultRead(BaseModel):
    id: int
    scoreInPoints: int
    isPassed: bool
    durationInMinutes: int
    result: int
    testId: int
    userId: int

    model_config = ConfigDict(from_attributes=True)

class CourseCategoryCreate(BaseModel):
    name: str

class CourseCategoryRead(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

class TopicContentCreate(BaseModel):
    description: str
    file: str
    topicId: int

class TopicContentRead(BaseModel):
    id: int
    description: str
    file: str
    topicId: int

    model_config = ConfigDict(from_attributes=True)

class CourseEnrollmentCreate(BaseModel):
    dateStarted: Optional[str]
    dateEnded: Optional[str]
    courseId: int
    userId: int

class CourseEnrollmentRead(BaseModel):
    id: int
    dateStarted: Optional[str]
    dateEnded: Optional[str]
    courseId: int
    userId: int

    model_config = ConfigDict(from_attributes=True)

class ModulePassedCreate(BaseModel):
    moduleId: int
    isPassed: bool
    userId: int
    datePassed: Optional[str]

class ModulePassedRead(BaseModel):
    id: int
    moduleId: int
    isPassed: bool
    userId: int
    datePassed: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class RoleCreate(BaseModel):
    name: str

class RoleRead(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

class PermissionCreate(BaseModel):
    action: str

class PermissionRead(BaseModel):
    id: int
    action: str

    model_config = ConfigDict(from_attributes=True)

class RolePermissionCreate(BaseModel):
    roleId: int
    permissionId: int

class RolePermissionRead(BaseModel):
    id: int
    roleId: int
    permissionId: int

    model_config = ConfigDict(from_attributes=True)

# Backwards-compatible aliases used by other modules (previous naming)
CourseIn = CourseCreate
CourseOut = CourseRead
ModuleIn = ModuleCreate
ModuleOut = ModuleRead
TestIn = TestCreate
TestOut = TestRead
AnswerIn = AnswerCreate
QuestionIn = QuestionCreate
