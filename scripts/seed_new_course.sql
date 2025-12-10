-- Скрипт для создания нового курса с модулями и тестами
-- Курс создается преподавателем с ID=8611021619616045

-- Создаем новый курс
INSERT INTO public."Course" (id, name, description, "categoryId", "authorId", "isPublished")
VALUES (
    9000000001,
    'Основы программирования на Python',
    'Комплексный курс для изучения основ языка Python с нуля. Включает синтаксис, структуры данных и основы ООП.',
    1,
    8611021619616045,
    true
)
ON CONFLICT (id) DO NOTHING;

-- Создаем три модуля
INSERT INTO public."Module" (id, name, description, "courseId")
VALUES 
    (9100000001, 'Модуль 1: Введение в Python', 'Основы синтаксиса, переменные, типы данных', 9000000001),
    (9100000002, 'Модуль 2: Управляющие конструкции', 'Условия, циклы, функции', 9000000001),
    (9100000003, 'Модуль 3: ООП в Python', 'Классы, объекты, наследование', 9000000001)
ON CONFLICT (id) DO NOTHING;

-- Создаем топики для модулей
INSERT INTO public."Topic" (id, name, description, "moduleId")
VALUES 
    (9200000001, 'Переменные и типы данных', 'Изучение базовых типов данных в Python', 9100000001),
    (9200000002, 'Операторы', 'Арифметические, логические и операторы сравнения', 9100000001),
    (9200000003, 'Условные операторы', 'Конструкции if-elif-else', 9100000002),
    (9200000004, 'Циклы', 'Циклы for и while', 9100000002),
    (9200000005, 'Функции', 'Определение и вызов функций, параметры', 9100000002),
    (9200000006, 'Классы и объекты', 'Основы ООП, создание классов', 9100000003),
    (9200000007, 'Наследование', 'Наследование классов в Python', 9100000003)
ON CONFLICT (id) DO NOTHING;

-- ===== ТЕСТЫ И ВОПРОСЫ ДЛЯ МОДУЛЯ 1 =====

-- Тест 1 для Модуля 1
INSERT INTO public."Test" (id, name, description, "durationInMinutes", "moduleId", "courseId")
VALUES (
    9300000001,
    'Тест: Переменные и типы данных',
    'Проверка знаний по переменным и типам данных в Python',
    10,
    9100000001,
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- Вопросы для Теста 1 Модуля 1
INSERT INTO public."Question" (id, text, picture, "complexityPoints", "testId", "questionType", "topicId")
VALUES 
    (9400000001, 'Какой тип данных имеет переменная x = 42?', NULL, 1, 9300000001, 'test', 9200000001),
    (9400000002, 'Как правильно объявить строковую переменную в Python?', NULL, 1, 9300000001, 'test', 9200000001),
    (9400000003, 'Что вернет выражение type([1, 2, 3])?', NULL, 1, 9300000001, 'test', 9200000001)
ON CONFLICT (id) DO NOTHING;

-- Ответы для вопросов Теста 1 Модуля 1
INSERT INTO public."Answer" (id, "isCorrect", text, "questionId")
VALUES 
    -- Вопрос 1
    (9500000001, true, 'int', 9400000001),
    (9500000002, false, 'float', 9400000001),
    (9500000003, false, 'str', 9400000001),
    (9500000004, false, 'bool', 9400000001),
    -- Вопрос 2
    (9500000005, true, 'name = "Python"', 9400000002),
    (9500000006, false, 'String name = "Python"', 9400000002),
    (9500000007, false, 'var name = "Python"', 9400000002),
    (9500000008, false, 'name := "Python"', 9400000002),
    -- Вопрос 3
    (9500000009, true, '<class ''list''>', 9400000003),
    (9500000010, false, '<class ''tuple''>', 9400000003),
    (9500000011, false, '<class ''dict''>', 9400000003),
    (9500000012, false, '<class ''array''>', 9400000003)
ON CONFLICT (id) DO NOTHING;

-- Тест 2 для Модуля 1
INSERT INTO public."Test" (id, name, description, "durationInMinutes", "moduleId", "courseId")
VALUES (
    9300000002,
    'Тест: Операторы в Python',
    'Проверка знаний по операторам',
    10,
    9100000001,
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- Вопросы для Теста 2 Модуля 1
INSERT INTO public."Question" (id, text, picture, "complexityPoints", "testId", "questionType", "topicId")
VALUES 
    (9400000004, 'Что вернет выражение 10 // 3?', NULL, 1, 9300000002, 'test', 9200000002),
    (9400000005, 'Какой оператор используется для проверки равенства?', NULL, 1, 9300000002, 'test', 9200000002),
    (9400000006, 'Что вернет выражение True and False?', NULL, 1, 9300000002, 'test', 9200000002)
ON CONFLICT (id) DO NOTHING;

-- Ответы для вопросов Теста 2 Модуля 1
INSERT INTO public."Answer" (id, "isCorrect", text, "questionId")
VALUES 
    -- Вопрос 4
    (9500000013, true, '3', 9400000004),
    (9500000014, false, '3.33', 9400000004),
    (9500000015, false, '3.0', 9400000004),
    (9500000016, false, '4', 9400000004),
    -- Вопрос 5
    (9500000017, true, '==', 9400000005),
    (9500000018, false, '=', 9400000005),
    (9500000019, false, '===', 9400000005),
    (9500000020, false, 'eq', 9400000005),
    -- Вопрос 6
    (9500000021, true, 'False', 9400000006),
    (9500000022, false, 'True', 9400000006),
    (9500000023, false, '0', 9400000006),
    (9500000024, false, 'None', 9400000006)
ON CONFLICT (id) DO NOTHING;

-- ===== ТЕСТЫ И ВОПРОСЫ ДЛЯ МОДУЛЯ 2 =====

-- Тест 1 для Модуля 2
INSERT INTO public."Test" (id, name, description, "durationInMinutes", "moduleId", "courseId")
VALUES (
    9300000003,
    'Тест: Условия и циклы',
    'Проверка знаний по условным операторам и циклам',
    15,
    9100000002,
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- Вопросы для Теста 1 Модуля 2
INSERT INTO public."Question" (id, text, picture, "complexityPoints", "testId", "questionType", "topicId")
VALUES 
    (9400000007, 'Какая конструкция используется для множественного выбора?', NULL, 1, 9300000003, 'test', 9200000003),
    (9400000008, 'Какой цикл используется для итерации по последовательности?', NULL, 1, 9300000003, 'test', 9200000004),
    (9400000009, 'Что делает оператор break в цикле?', NULL, 1, 9300000003, 'test', 9200000004)
ON CONFLICT (id) DO NOTHING;

-- Ответы для вопросов Теста 1 Модуля 2
INSERT INTO public."Answer" (id, "isCorrect", text, "questionId")
VALUES 
    -- Вопрос 7
    (9500000025, true, 'if-elif-else', 9400000007),
    (9500000026, false, 'switch-case', 9400000007),
    (9500000027, false, 'if-then-else', 9400000007),
    (9500000028, false, 'select-case', 9400000007),
    -- Вопрос 8
    (9500000029, true, 'for', 9400000008),
    (9500000030, false, 'foreach', 9400000008),
    (9500000031, false, 'do', 9400000008),
    (9500000032, false, 'iterate', 9400000008),
    -- Вопрос 9
    (9500000033, true, 'Прерывает выполнение цикла', 9400000009),
    (9500000034, false, 'Переходит к следующей итерации', 9400000009),
    (9500000035, false, 'Завершает программу', 9400000009),
    (9500000036, false, 'Возвращает значение', 9400000009)
ON CONFLICT (id) DO NOTHING;

-- Тест 2 для Модуля 2
INSERT INTO public."Test" (id, name, description, "durationInMinutes", "moduleId", "courseId")
VALUES (
    9300000004,
    'Тест: Функции в Python',
    'Проверка знаний по функциям',
    10,
    9100000002,
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- Вопросы для Теста 2 Модуля 2
INSERT INTO public."Question" (id, text, picture, "complexityPoints", "testId", "questionType", "topicId")
VALUES 
    (9400000010, 'Какое ключевое слово используется для определения функции?', NULL, 1, 9300000004, 'test', 9200000005),
    (9400000011, 'Что вернет функция, если не указан return?', NULL, 1, 9300000004, 'test', 9200000005),
    (9400000012, 'Как передать несколько аргументов в функцию?', NULL, 1, 9300000004, 'test', 9200000005)
ON CONFLICT (id) DO NOTHING;

-- Ответы для вопросов Теста 2 Модуля 2
INSERT INTO public."Answer" (id, "isCorrect", text, "questionId")
VALUES 
    -- Вопрос 10
    (9500000037, true, 'def', 9400000010),
    (9500000038, false, 'function', 9400000010),
    (9500000039, false, 'func', 9400000010),
    (9500000040, false, 'define', 9400000010),
    -- Вопрос 11
    (9500000041, true, 'None', 9400000011),
    (9500000042, false, '0', 9400000011),
    (9500000043, false, 'null', 9400000011),
    (9500000044, false, 'undefined', 9400000011),
    -- Вопрос 12
    (9500000045, true, 'Через запятую: func(arg1, arg2)', 9400000012),
    (9500000046, false, 'Через точку с запятой: func(arg1; arg2)', 9400000012),
    (9500000047, false, 'В массиве: func([arg1, arg2])', 9400000012),
    (9500000048, false, 'Через пробел: func(arg1 arg2)', 9400000012)
ON CONFLICT (id) DO NOTHING;

-- ===== ТЕСТЫ И ВОПРОСЫ ДЛЯ МОДУЛЯ 3 =====

-- Тест 1 для Модуля 3
INSERT INTO public."Test" (id, name, description, "durationInMinutes", "moduleId", "courseId")
VALUES (
    9300000005,
    'Тест: Основы ООП',
    'Проверка знаний по классам и объектам',
    15,
    9100000003,
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- Вопросы для Теста 1 Модуля 3
INSERT INTO public."Question" (id, text, picture, "complexityPoints", "testId", "questionType", "topicId")
VALUES 
    (9400000013, 'Какое ключевое слово используется для создания класса?', NULL, 1, 9300000005, 'test', 9200000006),
    (9400000014, 'Какой метод вызывается при создании объекта?', NULL, 1, 9300000005, 'test', 9200000006),
    (9400000015, 'Что такое self в методах класса?', NULL, 1, 9300000005, 'test', 9200000006)
ON CONFLICT (id) DO NOTHING;

-- Ответы для вопросов Теста 1 Модуля 3
INSERT INTO public."Answer" (id, "isCorrect", text, "questionId")
VALUES 
    -- Вопрос 13
    (9500000049, true, 'class', 9400000013),
    (9500000050, false, 'object', 9400000013),
    (9500000051, false, 'struct', 9400000013),
    (9500000052, false, 'type', 9400000013),
    -- Вопрос 14
    (9500000053, true, '__init__', 9400000014),
    (9500000054, false, '__new__', 9400000014),
    (9500000055, false, 'constructor', 9400000014),
    (9500000056, false, '__create__', 9400000014),
    -- Вопрос 15
    (9500000057, true, 'Ссылка на текущий экземпляр класса', 9400000015),
    (9500000058, false, 'Имя класса', 9400000015),
    (9500000059, false, 'Родительский класс', 9400000015),
    (9500000060, false, 'Статическая переменная', 9400000015)
ON CONFLICT (id) DO NOTHING;

-- Тест 2 для Модуля 3
INSERT INTO public."Test" (id, name, description, "durationInMinutes", "moduleId", "courseId")
VALUES (
    9300000006,
    'Тест: Наследование',
    'Проверка знаний по наследованию классов',
    10,
    9100000003,
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- Вопросы для Теста 2 Модуля 3
INSERT INTO public."Question" (id, text, picture, "complexityPoints", "testId", "questionType", "topicId")
VALUES 
    (9400000016, 'Как объявить класс, наследующий другой класс?', NULL, 1, 9300000006, 'test', 9200000007),
    (9400000017, 'Какой метод вызывает метод родительского класса?', NULL, 1, 9300000006, 'test', 9200000007),
    (9400000018, 'Может ли класс в Python наследовать несколько классов?', NULL, 1, 9300000006, 'test', 9200000007)
ON CONFLICT (id) DO NOTHING;

-- Ответы для вопросов Теста 2 Модуля 3
INSERT INTO public."Answer" (id, "isCorrect", text, "questionId")
VALUES 
    -- Вопрос 16
    (9500000061, true, 'class Child(Parent):', 9400000016),
    (9500000062, false, 'class Child extends Parent:', 9400000016),
    (9500000063, false, 'class Child : Parent', 9400000016),
    (9500000064, false, 'class Child inherits Parent:', 9400000016),
    -- Вопрос 17
    (9500000065, true, 'super()', 9400000017),
    (9500000066, false, 'parent()', 9400000017),
    (9500000067, false, 'base()', 9400000017),
    (9500000068, false, 'this()', 9400000017),
    -- Вопрос 18
    (9500000069, true, 'Да, множественное наследование поддерживается', 9400000018),
    (9500000070, false, 'Нет, только одиночное наследование', 9400000018),
    (9500000071, false, 'Только через интерфейсы', 9400000018),
    (9500000072, false, 'Только с использованием миксинов', 9400000018)
ON CONFLICT (id) DO NOTHING;

-- Вывод информации
DO $$
BEGIN
    RAISE NOTICE '=== Создан новый курс ===';
    RAISE NOTICE 'ID курса: 9000000001';
    RAISE NOTICE 'Название: Основы программирования на Python';
    RAISE NOTICE 'Автор: ID 8611021619616045';
    RAISE NOTICE '';
    RAISE NOTICE 'Создано модулей: %', (SELECT COUNT(*) FROM public."Module" WHERE "courseId" = 9000000001);
    RAISE NOTICE 'Создано топиков: %', (SELECT COUNT(*) FROM public."Topic" WHERE "moduleId" IN (SELECT id FROM public."Module" WHERE "courseId" = 9000000001));
    RAISE NOTICE 'Создано тестов: %', (SELECT COUNT(*) FROM public."Test" WHERE "moduleId" IN (SELECT id FROM public."Module" WHERE "courseId" = 9000000001));
    RAISE NOTICE 'Создано вопросов: %', (SELECT COUNT(*) FROM public."Question" WHERE "testId" IN (SELECT id FROM public."Test" WHERE "moduleId" IN (SELECT id FROM public."Module" WHERE "courseId" = 9000000001)));
    RAISE NOTICE 'Создано ответов: %', (SELECT COUNT(*) FROM public."Answer" WHERE "questionId" IN (SELECT id FROM public."Question" WHERE "testId" IN (SELECT id FROM public."Test" WHERE "moduleId" IN (SELECT id FROM public."Module" WHERE "courseId" = 9000000001))));
    RAISE NOTICE '';
    RAISE NOTICE 'Структура курса:';
    RAISE NOTICE '  Модуль 1: 2 теста (по 3 вопроса)';
    RAISE NOTICE '  Модуль 2: 2 теста (по 3 вопроса)';
    RAISE NOTICE '  Модуль 3: 2 теста (по 3 вопроса)';
END $$;
