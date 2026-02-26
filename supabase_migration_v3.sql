-- Create settings table usually for key-value pairs
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Seed default interval
INSERT INTO settings (key, value) VALUES ('interval_minutes', '30') ON CONFLICT (key) DO NOTHING;
