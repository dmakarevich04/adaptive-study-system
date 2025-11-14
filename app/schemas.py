from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

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
    picture: Optional[str]

class CourseRead(BaseModel):
    id: int
    name: str
    description: str
    categoryId: Optional[int]
    authorId: Optional[int]
    picture: Optional[str]
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
    questionType: Optional[str] = 'test'
    topicId: Optional[int] = None


class QuestionRead(BaseModel):
    id: int
    text: str
    picture: Optional[str]
    complexityPoints: int
    testId: int
    questionType: str
    topicId: Optional[int]

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

class UserAnswerCreate(BaseModel):
    userId: int
    testResultId: int
    questionId: int
    isCorrect: bool
    timeSpentInMinutes: Optional[int]

class UserAnswerRead(BaseModel):
    id: int
    userId: int
    testResultId: int
    questionId: int
    isCorrect: bool
    timeSpentInMinutes: Optional[int]

    model_config = ConfigDict(from_attributes=True)

class UserModuleKnowledgeCreate(BaseModel):
    userId: int
    moduleId: int
    knowledge: float

class UserModuleKnowledgeRead(BaseModel):
    id: int
    userId: int
    moduleId: int
    knowledge: float
    lastUpdated: Optional[date]

    model_config = ConfigDict(from_attributes=True)

class UserCourseKnowledgeCreate(BaseModel):
    userId: int
    courseId: int
    knowledge: float

class UserCourseKnowledgeRead(BaseModel):
    id: int
    userId: int
    courseId: int
    knowledge: float
    lastUpdated: Optional[date]

    model_config = ConfigDict(from_attributes=True)

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
    dateStarted: Optional[date]
    dateEnded: Optional[date]
    courseId: int
    userId: int

class CourseEnrollmentRead(BaseModel):
    id: int
    dateStarted: Optional[date]
    dateEnded: Optional[date]
    courseId: int
    userId: int

    model_config = ConfigDict(from_attributes=True)

class ModulePassedCreate(BaseModel):
    moduleId: int
    isPassed: bool
    userId: int
    datePassed: Optional[date]

class ModulePassedRead(BaseModel):
    id: int
    moduleId: int
    isPassed: bool
    userId: int
    datePassed: Optional[date]

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
