-- Скрипт для заполнения базы данных тестовыми данными
-- Создаем пользователя с ID=4 и заполняем от его имени тесты, ответы и результаты
-- Используем существующие курсы и тесты от пользователя с ID=8611021619616045

-- Создаем пользователя с ID=4 (пароль: testuser123)
INSERT INTO public."User" (id, login, password, name, surname, "roleId")
VALUES (
    4, 
    'testuser', 
    '$pbkdf2-sha256$29000$HAOAsHbuvbcWgpAyplSK0Q$VKb/fn9ETv7S68.T2/jy1y5y4BMt5BSJOBpXAP7bCZ4', -- bcrypt hash для "testuser123"
    'Тестовый', 
    'Пользователь', 
    1 -- student role
)
ON CONFLICT (id) DO NOTHING;

-- Записываем пользователя на курсы
-- Предполагаем, что есть курсы с ID, созданные пользователем 8611021619616045
WITH courses_list AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM public."Course" 
    WHERE "authorId" = 8611021619616045
)
INSERT INTO public."CourseEnrollment" (id, "dateStarted", "dateEnded", "courseId", "userId")
SELECT 
    100000 + rn,
    CURRENT_DATE - (rn * 5)::integer,
    NULL,
    id,
    4
FROM courses_list
WHERE rn <= 2
ON CONFLICT (id) DO NOTHING;

-- Пройденные модули (первый модуль пройден на 100%, второй на 50%)
WITH modules_list AS (
    SELECT m.id, ROW_NUMBER() OVER (ORDER BY m.id) as rn
    FROM public."Module" m
    INNER JOIN public."Course" c ON m."courseId" = c.id
    WHERE c."authorId" = 8611021619616045
)
INSERT INTO public."ModulePassed" (id, "moduleId", "isPassed", "userId", "datePassed")
SELECT 
    200000 + rn,
    id,
    CASE WHEN rn = 1 THEN true ELSE false END,
    4,
    CASE WHEN rn = 1 THEN '2025-11-18'::date ELSE NULL END
FROM modules_list
WHERE rn <= 2
ON CONFLICT (id) DO NOTHING;

-- Знания по модулям
WITH modules_list AS (
    SELECT m.id, ROW_NUMBER() OVER (ORDER BY m.id) as rn
    FROM public."Module" m
    INNER JOIN public."Course" c ON m."courseId" = c.id
    WHERE c."authorId" = 8611021619616045
)
INSERT INTO public."UserModuleKnowledge" (id, "userId", "moduleId", knowledge, "lastUpdated")
SELECT 
    300000 + rn,
    4,
    id,
    CASE WHEN rn = 1 THEN 100.0 ELSE 50.0 END,
    CURRENT_DATE - (10 - rn * 5)::integer
FROM modules_list
WHERE rn <= 2
ON CONFLICT (id) DO NOTHING;

-- Знания по курсам
WITH courses_list AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM public."Course"
    WHERE "authorId" = 8611021619616045
)
INSERT INTO public."UserCourseKnowledge" (id, "userId", "courseId", knowledge, "lastUpdated")
SELECT 
    400000 + rn,
    4,
    id,
    75.0,
    CURRENT_DATE - 5
FROM courses_list
WHERE rn <= 2
ON CONFLICT (id) DO NOTHING;

-- Результаты тестов
-- Тест 1: Пройден на 100% (2 попытки - первая 80%, вторая 100%)
WITH test_info AS (
    SELECT t.id as test_id, t."moduleId", t."courseId"
    FROM public."Test" t
    INNER JOIN public."Module" m ON t."moduleId" = m.id
    INNER JOIN public."Course" c ON m."courseId" = c.id
    WHERE c."authorId" = 8611021619616045
    ORDER BY t.id
    LIMIT 1
),
question_count AS (
    SELECT test_info.test_id, COUNT(*) as total_questions, SUM("complexityPoints") as total_points
    FROM test_info
    CROSS JOIN LATERAL (
        SELECT q.id, q."complexityPoints"
        FROM public."Question" q
        WHERE q."testId" = test_info.test_id
    ) questions
    GROUP BY test_info.test_id
)
INSERT INTO public."TestResult" (id, "scoreInPoints", "isPassed", "durationInMinutes", result, "testId", "userId", created_at)
SELECT 
    500001,
    FLOOR(question_count.total_points * 0.8)::bigint,
    true,
    5.5,
    80,
    question_count.test_id,
    4,
    '2025-11-16 10:30:00'::timestamp
FROM test_info, question_count
ON CONFLICT (id) DO NOTHING;

WITH test_info AS (
    SELECT t.id as test_id, t."moduleId", t."courseId"
    FROM public."Test" t
    INNER JOIN public."Module" m ON t."moduleId" = m.id
    INNER JOIN public."Course" c ON m."courseId" = c.id
    WHERE c."authorId" = 8611021619616045
    ORDER BY t.id
    LIMIT 1
),
question_count AS (
    SELECT test_info.test_id, COUNT(*) as total_questions, SUM("complexityPoints") as total_points
    FROM test_info
    CROSS JOIN LATERAL (
        SELECT q.id, q."complexityPoints"
        FROM public."Question" q
        WHERE q."testId" = test_info.test_id
    ) questions
    GROUP BY test_info.test_id
)
INSERT INTO public."TestResult" (id, "scoreInPoints", "isPassed", "durationInMinutes", result, "testId", "userId", created_at)
SELECT 
    500002,
    question_count.total_points::bigint,
    true,
    4.2,
    100,
    question_count.test_id,
    4,
    '2025-11-18 14:20:00'::timestamp
FROM test_info, question_count
ON CONFLICT (id) DO NOTHING;

-- Тест 2: Пройден на 85% (1 попытка)
WITH test_info AS (
    SELECT t.id as test_id
    FROM public."Test" t
    INNER JOIN public."Module" m ON t."moduleId" = m.id
    INNER JOIN public."Course" c ON m."courseId" = c.id
    WHERE c."authorId" = 8611021619616045
    ORDER BY t.id
    LIMIT 1 OFFSET 1
),
question_count AS (
    SELECT test_info.test_id, COUNT(*) as total_questions, SUM("complexityPoints") as total_points
    FROM test_info
    CROSS JOIN LATERAL (
        SELECT q.id, q."complexityPoints"
        FROM public."Question" q
        WHERE q."testId" = test_info.test_id
    ) questions
    GROUP BY test_info.test_id
)
INSERT INTO public."TestResult" (id, "scoreInPoints", "isPassed", "durationInMinutes", result, "testId", "userId", created_at)
SELECT 
    500003,
    FLOOR(question_count.total_points * 0.85)::bigint,
    true,
    6.8,
    85,
    question_count.test_id,
    4,
    '2025-11-20 11:15:00'::timestamp
FROM test_info, question_count
ON CONFLICT (id) DO NOTHING;

-- Тест 3: Не пройден - 65% (2 попытки - обе неуспешные)
WITH test_info AS (
    SELECT t.id as test_id
    FROM public."Test" t
    INNER JOIN public."Module" m ON t."moduleId" = m.id
    INNER JOIN public."Course" c ON m."courseId" = c.id
    WHERE c."authorId" = 8611021619616045
    ORDER BY t.id
    LIMIT 1 OFFSET 2
),
question_count AS (
    SELECT test_info.test_id, COUNT(*) as total_questions, SUM("complexityPoints") as total_points
    FROM test_info
    CROSS JOIN LATERAL (
        SELECT q.id, q."complexityPoints"
        FROM public."Question" q
        WHERE q."testId" = test_info.test_id
    ) questions
    GROUP BY test_info.test_id
)
INSERT INTO public."TestResult" (id, "scoreInPoints", "isPassed", "durationInMinutes", result, "testId", "userId", created_at)
SELECT 
    500004,
    FLOOR(question_count.total_points * 0.55)::bigint,
    false,
    8.0,
    55,
    question_count.test_id,
    4,
    '2025-11-22 09:00:00'::timestamp
FROM test_info, question_count
WHERE question_count.test_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

WITH test_info AS (
    SELECT t.id as test_id
    FROM public."Test" t
    INNER JOIN public."Module" m ON t."moduleId" = m.id
    INNER JOIN public."Course" c ON m."courseId" = c.id
    WHERE c."authorId" = 8611021619616045
    ORDER BY t.id
    LIMIT 1 OFFSET 2
),
question_count AS (
    SELECT test_info.test_id, COUNT(*) as total_questions, SUM("complexityPoints") as total_points
    FROM test_info
    CROSS JOIN LATERAL (
        SELECT q.id, q."complexityPoints"
        FROM public."Question" q
        WHERE q."testId" = test_info.test_id
    ) questions
    GROUP BY test_info.test_id
)
INSERT INTO public."TestResult" (id, "scoreInPoints", "isPassed", "durationInMinutes", result, "testId", "userId", created_at)
SELECT 
    500005,
    FLOOR(question_count.total_points * 0.65)::bigint,
    false,
    7.3,
    65,
    question_count.test_id,
    4,
    '2025-11-24 16:45:00'::timestamp
FROM test_info, question_count
WHERE question_count.test_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Ответы пользователя для первого теста (попытка 1 - 80%)
WITH test_result_info AS (
    SELECT 500001 as result_id, 
           (SELECT t.id FROM public."Test" t
            INNER JOIN public."Module" m ON t."moduleId" = m.id
            INNER JOIN public."Course" c ON m."courseId" = c.id
            WHERE c."authorId" = 8611021619616045
            ORDER BY t.id LIMIT 1) as test_id
),
questions_list AS (
    SELECT q.id as question_id, ROW_NUMBER() OVER (ORDER BY q.id) as rn
    FROM test_result_info
    INNER JOIN public."Question" q ON q."testId" = test_result_info.test_id
)
INSERT INTO public."UserAnswer" (id, "userId", "testResultId", "questionId", "isCorrect", "timeSpentInMinutes")
SELECT 
    600000 + rn,
    4,
    500001,
    question_id,
    CASE WHEN rn <= 4 THEN true ELSE false END, -- 4 из 5 правильных = 80%
    FLOOR(RANDOM() * 3 + 1)::bigint
FROM questions_list
WHERE rn <= 5
ON CONFLICT (id) DO NOTHING;

-- Ответы пользователя для первого теста (попытка 2 - 100%)
WITH test_result_info AS (
    SELECT 500002 as result_id,
           (SELECT t.id FROM public."Test" t
            INNER JOIN public."Module" m ON t."moduleId" = m.id
            INNER JOIN public."Course" c ON m."courseId" = c.id
            WHERE c."authorId" = 8611021619616045
            ORDER BY t.id LIMIT 1) as test_id
),
questions_list AS (
    SELECT q.id as question_id, ROW_NUMBER() OVER (ORDER BY q.id) as rn
    FROM test_result_info
    INNER JOIN public."Question" q ON q."testId" = test_result_info.test_id
)
INSERT INTO public."UserAnswer" (id, "userId", "testResultId", "questionId", "isCorrect", "timeSpentInMinutes")
SELECT 
    600100 + rn,
    4,
    500002,
    question_id,
    true, -- все правильные = 100%
    FLOOR(RANDOM() * 2 + 1)::bigint
FROM questions_list
WHERE rn <= 5
ON CONFLICT (id) DO NOTHING;

-- Ответы пользователя для второго теста (85%)
WITH test_result_info AS (
    SELECT 500003 as result_id,
           (SELECT t.id FROM public."Test" t
            INNER JOIN public."Module" m ON t."moduleId" = m.id
            INNER JOIN public."Course" c ON m."courseId" = c.id
            WHERE c."authorId" = 8611021619616045
            ORDER BY t.id LIMIT 1 OFFSET 1) as test_id
),
questions_list AS (
    SELECT q.id as question_id, ROW_NUMBER() OVER (ORDER BY q.id) as rn
    FROM test_result_info
    INNER JOIN public."Question" q ON q."testId" = test_result_info.test_id
)
INSERT INTO public."UserAnswer" (id, "userId", "testResultId", "questionId", "isCorrect", "timeSpentInMinutes")
SELECT 
    600200 + rn,
    4,
    500003,
    question_id,
    CASE WHEN rn <= 4 OR rn = 6 THEN true ELSE false END, -- примерно 85%
    FLOOR(RANDOM() * 3 + 1)::bigint
FROM questions_list
WHERE rn <= 6
ON CONFLICT (id) DO NOTHING;

-- Ответы пользователя для третьего теста (попытка 1 - 55%)
WITH test_result_info AS (
    SELECT 500004 as result_id,
           (SELECT t.id FROM public."Test" t
            INNER JOIN public."Module" m ON t."moduleId" = m.id
            INNER JOIN public."Course" c ON m."courseId" = c.id
            WHERE c."authorId" = 8611021619616045
            ORDER BY t.id LIMIT 1 OFFSET 2) as test_id
),
questions_list AS (
    SELECT q.id as question_id, ROW_NUMBER() OVER (ORDER BY q.id) as rn
    FROM test_result_info
    INNER JOIN public."Question" q ON q."testId" = test_result_info.test_id
)
INSERT INTO public."UserAnswer" (id, "userId", "testResultId", "questionId", "isCorrect", "timeSpentInMinutes")
SELECT 
    600300 + rn,
    4,
    500004,
    question_id,
    CASE WHEN rn <= 3 THEN true ELSE false END, -- 3 из 5+ = 55%
    FLOOR(RANDOM() * 4 + 1)::bigint
FROM questions_list
WHERE rn <= 5
ON CONFLICT (id) DO NOTHING;

-- Ответы пользователя для третьего теста (попытка 2 - 65%)
WITH test_result_info AS (
    SELECT 500005 as result_id,
           (SELECT t.id FROM public."Test" t
            INNER JOIN public."Module" m ON t."moduleId" = m.id
            INNER JOIN public."Course" c ON m."courseId" = c.id
            WHERE c."authorId" = 8611021619616045
            ORDER BY t.id LIMIT 1 OFFSET 2) as test_id
),
questions_list AS (
    SELECT q.id as question_id, ROW_NUMBER() OVER (ORDER BY q.id) as rn
    FROM test_result_info
    INNER JOIN public."Question" q ON q."testId" = test_result_info.test_id
)
INSERT INTO public."UserAnswer" (id, "userId", "testResultId", "questionId", "isCorrect", "timeSpentInMinutes")
SELECT 
    600400 + rn,
    4,
    500005,
    question_id,
    CASE WHEN rn <= 3 OR rn = 5 THEN true ELSE false END, -- примерно 65%
    FLOOR(RANDOM() * 3 + 1)::bigint
FROM questions_list
WHERE rn <= 5
ON CONFLICT (id) DO NOTHING;

-- Вывод информации
DO $$
BEGIN
    RAISE NOTICE 'Создан пользователь: ID=4, login=testuser, password=testuser123';
    RAISE NOTICE 'Записан на % курсов', (SELECT COUNT(*) FROM public."CourseEnrollment" WHERE "userId" = 4);
    RAISE NOTICE 'Создано % результатов тестов', (SELECT COUNT(*) FROM public."TestResult" WHERE "userId" = 4);
    RAISE NOTICE 'Создано % ответов', (SELECT COUNT(*) FROM public."UserAnswer" WHERE "userId" = 4);
    RAISE NOTICE 'Уровень знаний по модулям записан';
    RAISE NOTICE 'Уровень знаний по курсам записан';
END $$;
