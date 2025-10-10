DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tests') THEN
      PERFORM dblink_exec('dbname=postgres user=' || current_user, 'CREATE DATABASE tests');
   END IF;
END
$$;
