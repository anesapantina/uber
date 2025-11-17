-- Messages Table for Ride Chat
CREATE TABLE ride_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('rider', 'driver', 'system')),
  sender_id UUID,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX idx_ride_messages_ride_id ON ride_messages(ride_id);
CREATE INDEX idx_ride_messages_created_at ON ride_messages(created_at);

-- Enable Row Level Security
ALTER TABLE ride_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view messages for their rides"
  ON ride_messages FOR SELECT
  USING (true);

CREATE POLICY "Users can send messages for their rides"
  ON ride_messages FOR INSERT
  WITH CHECK (true);
