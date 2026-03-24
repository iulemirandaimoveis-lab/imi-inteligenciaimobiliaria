-- Allow 'update' and 'info' notification types for system update announcements
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('lead', 'development', 'evaluation', 'consultation', 'system', 'comment', 'update', 'info'));
