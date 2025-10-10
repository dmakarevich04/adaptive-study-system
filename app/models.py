from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import Column, BigInteger, Boolean, Text, Date, ForeignKey, Integer

Base = declarative_base()

class User(Base):
    __tablename__ = 'User'
    id = Column(BigInteger, primary_key=True)
    login = Column(Text, nullable=False, unique=True)
    password = Column(Text, nullable=False)
    name = Column(Text, nullable=False)
    surname = Column(Text, nullable=False)
    avatar = Column(Text)
    roleId = Column(BigInteger, ForeignKey('Roles.id'))
    role = relationship('Role')

class CourseCategory(Base):
    __tablename__ = 'CourseCategory'
    id = Column(BigInteger, primary_key=True)
    name = Column(Text, nullable=False)

class Course(Base):
    __tablename__ = 'Course'
    id = Column(BigInteger, primary_key=True)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    categoryId = Column(BigInteger, ForeignKey('CourseCategory.id'))
    authorId = Column(BigInteger, ForeignKey('User.id'))
    picture = Column(Text)
    isPublished = Column(Boolean, nullable=False, default=False)

class Module(Base):
    __tablename__ = 'Module'
    id = Column(BigInteger, primary_key=True)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    courseId = Column(BigInteger, ForeignKey('Course.id'))

class ModulePassed(Base):
    __tablename__ = 'ModulePassed'
    id = Column(BigInteger, primary_key=True)
    moduleId = Column(BigInteger, ForeignKey('Module.id'))
    isPassed = Column(Boolean, nullable=False)
    userId = Column(BigInteger, ForeignKey('User.id'))
    datePassed = Column(Date)

class CourseEnrollment(Base):
    __tablename__ = 'CourseEnrollment'
    id = Column(BigInteger, primary_key=True)
    dateStarted = Column(Date, nullable=False)
    dateEnded = Column(Date)
    courseId = Column(BigInteger, ForeignKey('Course.id'))
    userId = Column(BigInteger, ForeignKey('User.id'))

class Topic(Base):
    __tablename__ = 'Topic'
    id = Column(BigInteger, primary_key=True)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    moduleId = Column(BigInteger, ForeignKey('Module.id'))

class TopicContent(Base):
    __tablename__ = 'TopicContent'
    id = Column(BigInteger, primary_key=True)
    description = Column(Text, nullable=False)
    file = Column(Text, nullable=False)
    topicId = Column(BigInteger, ForeignKey('Topic.id'))

class Test(Base):
    __tablename__ = 'Test'
    id = Column(BigInteger, primary_key=True)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    durationInMinutes = Column(BigInteger, nullable=False)
    moduleId = Column(BigInteger, ForeignKey('Module.id'), nullable=True)
    courseId = Column(BigInteger, ForeignKey('Course.id'), nullable=True)

class Question(Base):
    __tablename__ = 'Question'
    id = Column(BigInteger, primary_key=True)
    text = Column(Text, nullable=False)
    picture = Column(Text)
    complexityPoints = Column(BigInteger, nullable=False)
    testId = Column(BigInteger, ForeignKey('Test.id'))


class Answer(Base):
    __tablename__ = 'Answer'
    id = Column(BigInteger, primary_key=True)
    isCorrect = Column(Boolean, nullable=False)
    text = Column(Text, nullable=False)
    questionId = Column(BigInteger, ForeignKey('Question.id'))

class TestResult(Base):
    __tablename__ = 'TestResult'
    id = Column(BigInteger, primary_key=True)
    scoreInPoints = Column(BigInteger, nullable=False)
    isPassed = Column(Boolean, nullable=False)
    durationInMinutes = Column(BigInteger, nullable=False)
    result = Column(BigInteger, nullable=False)
    testId = Column(BigInteger, ForeignKey('Test.id'))
    userId = Column(BigInteger, ForeignKey('User.id'))

class Role(Base):
    __tablename__ = 'Roles'
    id = Column(BigInteger, primary_key=True)
    name = Column(Text, nullable=False)

class Permission(Base):
    __tablename__ = 'Permissions'
    id = Column(BigInteger, primary_key=True)
    action = Column(Text, nullable=False)

class RolePermission(Base):
    __tablename__ = 'RolePermissions'
    id = Column(BigInteger, primary_key=True)
    roleId = Column(BigInteger, ForeignKey('Roles.id'))
    permissionId = Column(BigInteger, ForeignKey('Permissions.id'))
