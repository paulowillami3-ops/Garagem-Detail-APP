-- Function to prevent double bookings
CREATE OR REPLACE FUNCTION check_appointment_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Check for existing appointments at the same time
  -- We assume appointment_time is TIME and appointment_date is DATE
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE appointment_date = NEW.appointment_date
    AND appointment_time = NEW.appointment_time
    AND status != 'CANCELLED'
    AND id != COALESCE(NEW.id, -1) -- Handle new vs update
  ) THEN
    RAISE EXCEPTION 'Horário indisponível (reservado).';
  END IF;

  -- 2. Check for administrative blocks
  -- blocked_slots often uses TEXT for date/time in the codebase, so we cast to compare if needed.
  -- Adjust casting based on your actual column types in Supabase.
  IF EXISTS (
    SELECT 1 FROM blocked_slots
    WHERE date = TO_CHAR(NEW.appointment_date, 'YYYY-MM-DD')
    AND time LIKE TO_CHAR(NEW.appointment_time, 'HH24:MI') || '%' -- Handle potential ss
  ) THEN
      RAISE EXCEPTION 'Horário indisponível (bloqueado).';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove old trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS ensure_no_double_booking ON appointments;

-- Apply trigger before modification
CREATE TRIGGER ensure_no_double_booking
BEFORE INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION check_appointment_overlap();
