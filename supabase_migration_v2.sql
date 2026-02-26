-- Create table for weekly work hours configuration
CREATE TABLE IF NOT EXISTS work_hours (
    id SERIAL PRIMARY KEY,
    day_of_week INTEGER NOT NULL UNIQUE, -- 0=Sunday, 1=Monday, ..., 6=Saturday
    is_open BOOLEAN DEFAULT TRUE,
    start_time_1 TIME, -- Morning Start
    end_time_1 TIME,   -- Morning End
    start_time_2 TIME, -- Afternoon Start (optional)
    end_time_2 TIME,   -- Afternoon End (optional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default values if empty (Standard 09:00 - 12:00, 13:00 - 19:00 for Mon-Sat, Closed Sun)
INSERT INTO work_hours (day_of_week, is_open, start_time_1, end_time_1, start_time_2, end_time_2)
VALUES 
(0, false, '09:00', '12:00', '13:00', '19:00'), -- Sunday (Closed)
(1, true,  '09:00', '12:00', '13:00', '19:00'), -- Monday
(2, true,  '09:00', '12:00', '13:00', '19:00'), -- Tuesday
(3, true,  '09:00', '12:00', '13:00', '19:00'), -- Wednesday
(4, true,  '09:00', '12:00', '13:00', '19:00'), -- Thursday
(5, true,  '09:00', '12:00', '13:00', '19:00'), -- Friday
(6, true,  '09:00', '12:00', '13:00', '18:00')  -- Saturday
ON CONFLICT (day_of_week) DO NOTHING;
