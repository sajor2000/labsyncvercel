-- Add last_reminder_sent field to tasks table for email reminder tracking
ALTER TABLE tasks ADD COLUMN last_reminder_sent timestamp;

-- Create index for efficient reminder queries
CREATE INDEX IF NOT EXISTS task_reminder_due_date_idx ON tasks(due_date, last_reminder_sent) WHERE due_date IS NOT NULL AND status != 'COMPLETED';