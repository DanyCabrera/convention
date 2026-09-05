-- Tras eliminar tickets, renumerar correlativos 1..N y reiniciar la secuencia.

CREATE OR REPLACE FUNCTION renumber_ticket_correlatives()
RETURNS TRIGGER AS $$
DECLARE
  max_corr INTEGER;
BEGIN
  -- Evitar choques con UNIQUE mientras se reasignan
  UPDATE tickets SET correlative = -correlative WHERE correlative > 0;

  WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
    FROM tickets
  )
  UPDATE tickets AS t
  SET correlative = numbered.rn
  FROM numbered
  WHERE t.id = numbered.id;

  SELECT COALESCE(MAX(correlative), 0) INTO max_corr FROM tickets;

  IF max_corr = 0 THEN
    PERFORM setval('ticket_correlative_seq', 1, false);
  ELSE
    PERFORM setval('ticket_correlative_seq', max_corr + 1, false);
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tickets_renumber_correlative_after_delete ON tickets;

CREATE TRIGGER tickets_renumber_correlative_after_delete
  AFTER DELETE ON tickets
  FOR EACH STATEMENT
  EXECUTE FUNCTION renumber_ticket_correlatives();
