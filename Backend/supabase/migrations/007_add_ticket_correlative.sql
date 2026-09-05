-- Número correlativo visible en el ticket (1, 2, 3…)

CREATE SEQUENCE IF NOT EXISTS ticket_correlative_seq START WITH 1;

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS correlative INTEGER;

UPDATE tickets AS t
SET correlative = numbered.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM tickets
  WHERE correlative IS NULL
) AS numbered
WHERE t.id = numbered.id;

ALTER TABLE tickets
  ALTER COLUMN correlative SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tickets_correlative_unique'
  ) THEN
    ALTER TABLE tickets ADD CONSTRAINT tickets_correlative_unique UNIQUE (correlative);
  END IF;
END $$;

ALTER TABLE tickets
  ALTER COLUMN correlative SET DEFAULT nextval('ticket_correlative_seq');

SELECT setval(
  'ticket_correlative_seq',
  GREATEST(COALESCE((SELECT MAX(correlative) FROM tickets), 0), 1),
  (SELECT COUNT(*) > 0 FROM tickets)
);

CREATE INDEX IF NOT EXISTS idx_tickets_correlative ON tickets(correlative DESC);
