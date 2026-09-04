-- Planes académicos: diario (2790) y fin de semana (2890)

CREATE TYPE student_plan AS ENUM ('diario', 'fin_de_semana');

ALTER TABLE students
  ADD COLUMN plan student_plan;

UPDATE students
SET plan = CASE
  WHEN carnet LIKE '2790%' THEN 'diario'::student_plan
  WHEN carnet LIKE '2890%' THEN 'fin_de_semana'::student_plan
  ELSE 'diario'::student_plan
END
WHERE plan IS NULL;

ALTER TABLE students
  ALTER COLUMN plan SET NOT NULL;

CREATE INDEX idx_students_plan ON students(plan);
CREATE INDEX idx_students_plan_ciclo ON students(plan, ciclo);
