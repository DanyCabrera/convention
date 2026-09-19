-- Los docentes se registran solo con nombre; el correo deja de ser obligatorio
ALTER TABLE students ALTER COLUMN email DROP NOT NULL;
