-- Add toggles for morning and afternoon shifts
ALTER TABLE work_hours 
ADD COLUMN IF NOT EXISTS is_morning_open BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_afternoon_open BOOLEAN DEFAULT TRUE;
