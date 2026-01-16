-- Add new columns to rides table for enhanced features
ALTER TABLE rides
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS radius_km INTEGER DEFAULT 10;

-- Add Strava URL to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS strava_url TEXT;

-- Add notification preferences to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_radius_km INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS notification_bike_types TEXT[] DEFAULT ARRAY['Road', 'MTB'],
ADD COLUMN IF NOT EXISTS push_subscription JSONB;

-- Create notification_log table for tracking sent notifications
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notification_type TEXT DEFAULT 'new_ride',
  UNIQUE(user_id, ride_id, notification_type)
);

-- Enable RLS on notification_log
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own notification logs
CREATE POLICY "Users can view own notification logs"
  ON notification_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert notification logs (service role)
CREATE POLICY "Service can insert notification logs"
  ON notification_log
  FOR INSERT
  WITH CHECK (true);

-- Add index for faster geolocation queries
CREATE INDEX IF NOT EXISTS idx_rides_location ON rides(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add index for notification queries
CREATE INDEX IF NOT EXISTS idx_users_notifications ON users(notifications_enabled, notification_radius_km)
WHERE notifications_enabled = true;
