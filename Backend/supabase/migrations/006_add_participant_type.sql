-- Tipo de participante: estudiante o docente

CREATE TYPE participant_type AS ENUM ('estudiante', 'docente');

ALTER TABLE students
  ADD COLUMN participant_type participant_type NOT NULL DEFAULT 'estudiante';

ALTER TABLE students
  ADD COLUMN document_pdf TEXT;

-- Docentes no requieren carnet, ciclo, plan ni teléfono
ALTER TABLE students ALTER COLUMN carnet DROP NOT NULL;
ALTER TABLE students ALTER COLUMN ciclo DROP NOT NULL;
ALTER TABLE students ALTER COLUMN plan DROP NOT NULL;
ALTER TABLE students ALTER COLUMN phone DROP NOT NULL;

CREATE INDEX idx_students_participant_type ON students(participant_type);
