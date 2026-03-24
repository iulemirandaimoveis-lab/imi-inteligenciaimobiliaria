-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL CHECK (type IN ('lead', 'development', 'evaluation', 'consultation', 'system', 'comment')),
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "users_can_view_own_notifications" ON notifications
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "users_can_update_own_notifications" ON notifications
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "users_can_delete_own_notifications" ON notifications
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Admins can insert notifications for any user (system notifications)
-- Or triggers/functions can insert. 
-- Simple policy for authenticated users to insert (e.g. comment notifications)
CREATE POLICY "authenticated_can_insert_notifications" ON notifications
    FOR INSERT TO authenticated
    WITH CHECK (true); 

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_notifications_updated_at ON notifications;
CREATE TRIGGER trigger_update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
