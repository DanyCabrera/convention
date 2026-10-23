-- Revierte la entrada y el estado del ticket en una sola transacción.
CREATE OR REPLACE FUNCTION reset_attendance(participant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  participant_status student_status;
BEGIN
  SELECT status INTO participant_status
  FROM students WHERE id = participant_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF participant_status = 'confirmed' THEN
    UPDATE students
    SET status = 'pending', checked_in_at = NULL
    WHERE id = participant_id;

    UPDATE tickets
    SET status = CASE WHEN sent_at IS NULL THEN 'generated'::ticket_status
                      ELSE 'sent'::ticket_status END
    WHERE student_id = participant_id AND status = 'delivered';
  END IF;

  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION reset_attendance(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION reset_attendance(UUID) TO service_role;
