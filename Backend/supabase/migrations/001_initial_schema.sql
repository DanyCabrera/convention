-- Esquema inicial para registro de estudiantes en eventos universitarios

CREATE TYPE student_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE ticket_status AS ENUM ('generated', 'sent', 'delivered', 'failed');

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  carnet TEXT NOT NULL UNIQUE,
  ciclo INTEGER NOT NULL CHECK (ciclo IN (2, 4, 6, 8, 10)),
  status student_status NOT NULL DEFAULT 'pending',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL UNIQUE,
  qr_code TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'generated',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_ciclo ON students(ciclo);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_registered_at ON students(registered_at DESC);
CREATE INDEX idx_tickets_student_id ON tickets(student_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
