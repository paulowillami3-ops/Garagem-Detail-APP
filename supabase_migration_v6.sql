-- Add is_read column to chat_messages table
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Mark existing messages as read to avoid initial clutter (optional, but good for UX)
UPDATE chat_messages SET is_read = TRUE WHERE is_read IS FALSE;
