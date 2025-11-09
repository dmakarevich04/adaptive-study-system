"""
Seed script to populate the LMS database with example data.

Usage:
  - run locally (with .env present) or inside the web container
    python scripts/seed_data.py

This script uses SQL INSERT ... ON CONFLICT (id) DO NOTHING so it's safe
to run multiple times.
"""
from sqlalchemy import text
from app.db import engine
from app.auth import get_password_hash


def run():
    hashed_password = get_password_hash('pwd')
    statements = [
        # Roles
  """
    INSERT INTO public."Roles" (id, name)
    VALUES (1, 'student'), (2, 'teacher'), (3, 'admin')
  ON CONFLICT (id) DO NOTHING;
  """,

        # Permissions
  """
    INSERT INTO public."Permissions" (id, action)
    VALUES (1, 'read'), (2, 'write'), (3, 'grade')
  ON CONFLICT (id) DO NOTHING;
  """,

        # RolePermissions
        """
        INSERT INTO public."RolePermissions" (id, "roleId", "permissionId")
        VALUES (1, 1, 1), (2, 2, 1), (3, 2, 2), (4, 3, 1), (5, 3, 2), (6, 3, 3)
        ON CONFLICT (id) DO NOTHING;
        """,

        # Users
        f"""
        INSERT INTO public."User" (id, login, password, name, surname, "roleId")
        VALUES
          (1, 'student1', '{hashed_password}', 'Ivan', 'Ivanov', 1),
          (2, 'teacher1', '{hashed_password}', 'Petr', 'Petrov', 2),
          (3, 'admin', '{hashed_password}', 'Admin', 'User', 3)
        ON CONFLICT (id) DO NOTHING;
        """,

        # CourseCategory
  """
    INSERT INTO public."CourseCategory" (id, name)
    VALUES (1, 'Mathematics'), (2, 'Physics'), (3, 'Languages')
  ON CONFLICT (id) DO NOTHING;
  """,

        # Course
        """
        INSERT INTO public."Course" (id, name, description, "categoryId", "authorId", "isPublished")
        VALUES
          (1, 'Algebra 101', 'Basic algebra course', 1, 2, true),
          (2, 'Physics Basics', 'Intro to physics', 2, 2, false)
        ON CONFLICT (id) DO NOTHING;
        """,

        # Module
  """
    INSERT INTO public."Module" (id, name, description, "courseId")
    VALUES (1, 'Module 1', 'Introduction', 1), (2, 'Module 2', 'Advanced topics', 1)
  ON CONFLICT (id) DO NOTHING;
  """,

        # ModulePassed
        """
        INSERT INTO public."ModulePassed" (id, "moduleId", "isPassed", "userId", "datePassed")
        VALUES (1, 1, false, 1, NULL)
        ON CONFLICT (id) DO NOTHING;
        """,

        # CourseEnrollment
        """
        INSERT INTO public."CourseEnrollment" (id, "dateStarted", "dateEnded", "courseId", "userId")
        VALUES (1, CURRENT_DATE, NULL, 1, 1)
        ON CONFLICT (id) DO NOTHING;
        """,

        # Topic
  """
    INSERT INTO public."Topic" (id, name, description, "moduleId")
    VALUES (1, 'Topic 1', 'Basics', 1), (2, 'Topic 2', 'Deep dive', 2)
  ON CONFLICT (id) DO NOTHING;
  """,

        # TopicContent
  """
    INSERT INTO public."TopicContent" (id, description, file, "topicId")
    VALUES (1, 'Video lesson', '/content/1.mp4', 1)
  ON CONFLICT (id) DO NOTHING;
  """,

        # Test
  """
    INSERT INTO public."Test" (id, name, description, "durationInMinutes", "moduleId", "courseId")
    VALUES (1, 'Algebra Test', 'Short test', 30, 1, 1)
  ON CONFLICT (id) DO NOTHING;
  """,

        # Question
  """
    INSERT INTO public."Question" (id, text, picture, "complexityPoints", "testId")
    VALUES (1, '2+2=?', NULL, 1, 1)
  ON CONFLICT (id) DO NOTHING;
  """,

        # Answer
  """
    INSERT INTO public."Answer" (id, "isCorrect", text, "questionId")
    VALUES (1, true, '4', 1), (2, false, '3', 1)
  ON CONFLICT (id) DO NOTHING;
  """,

        # TestResult
        """
        INSERT INTO public."TestResult" (id, "scoreInPoints", "isPassed", "durationInMinutes", result, "testId", "userId")
        VALUES (1, 10, true, 5, 100, 1, 1)
        ON CONFLICT (id) DO NOTHING;
        """,
  # UserAnswer
  """
  INSERT INTO public."UserAnswer" (id, "userId", "testResultId", "questionId", "isCorrect", "timeSpentInMinutes")
  VALUES (1, 1, 1, 1, true, 1)
  ON CONFLICT (id) DO NOTHING;
  """,

  # UserModuleKnowledge
  """
  INSERT INTO public."UserModuleKnowledge" (id, "userId", "moduleId", knowledge, "lastUpdated")
  VALUES (1, 1, 1, 0.75, CURRENT_DATE)
  ON CONFLICT (id) DO NOTHING;
  """,

  # UserCourseKnowledge
  """
  INSERT INTO public."UserCourseKnowledge" (id, "userId", "courseId", knowledge, "lastUpdated")
  VALUES (1, 1, 1, 0.6, CURRENT_DATE)
  ON CONFLICT (id) DO NOTHING;
  """,
    ]

    with engine.begin() as conn:
        for i, stmt in enumerate(statements, start=1):
            print(f"Running statement {i}/{len(statements)}...", end=' ')
            conn.execute(text(stmt))
            print('OK')


if __name__ == '__main__':
    print('Starting seed script...')
    run()
    print('Seeding finished.')
