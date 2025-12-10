-- Скрипт для создания администратора и базовых ролей

-- Создаем роли, если их нет
INSERT INTO public."Roles" (id, name)
VALUES 
    (1, 'student'),
    (2, 'teacher'),
    (3, 'admin')
ON CONFLICT (id) DO NOTHING;

-- Создаем администратора (пароль: admin123)
-- Хеш сгенерирован через: python -c "from app.auth import get_password_hash; print(get_password_hash('admin123'))"
INSERT INTO public."User" (id, login, password, name, surname, "roleId")
VALUES (
    999999999,
    'admin',
    '$pbkdf2-sha256$29000$7r23NwZAaG0thfB+T6l1Lg$lqHLLQKj0j.aTBZx8fVMPWZ7nzYkQpvPYrQ5VVfCiZo',
    'Администратор',
    'Системы',
    3
)
ON CONFLICT (id) DO UPDATE 
SET "roleId" = 3,
    password = EXCLUDED.password;

-- Вывод информации
DO $$
BEGIN
    RAISE NOTICE '=== Администратор создан ===';
    RAISE NOTICE 'Логин: admin';
    RAISE NOTICE 'Пароль: admin123';
    RAISE NOTICE 'Роль: admin (ID=3)';
    RAISE NOTICE '';
    RAISE NOTICE 'Созданы роли:';
    RAISE NOTICE '  1 - student';
    RAISE NOTICE '  2 - teacher';
    RAISE NOTICE '  3 - admin';
END $$;
