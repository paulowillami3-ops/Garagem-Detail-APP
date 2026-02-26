-- Add display_order column if it doesn't exist
ALTER TABLE services ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Initialize display_order for existing items based on ID or Name order
-- This is a bit tricky in pure SQL without a sequence per row update in some dialects, 
-- but we can just set them all to 0 or ID for now.
UPDATE services SET display_order = id WHERE display_order = 0;
