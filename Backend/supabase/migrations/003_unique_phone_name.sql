-- Evitar duplicados de teléfono y nombre (case-insensitive)

ALTER TABLE students
  ADD CONSTRAINT students_phone_unique UNIQUE (phone);

CREATE UNIQUE INDEX idx_students_full_name_normalized
  ON students (LOWER(TRIM(full_name)));
