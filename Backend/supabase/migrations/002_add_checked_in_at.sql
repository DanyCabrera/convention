-- Registro de hora de check-in al escanear QR
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_students_checked_in_at
  ON students(checked_in_at DESC)
  WHERE status = 'confirmed';
