-- Uber MVP Database Schema for Supabase

-- Users Table (Riders)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_picture_url TEXT,
  home_address TEXT,
  work_address TEXT,
  saved_places JSONB,
  payment_method_id VARCHAR(255),
  card_last_four VARCHAR(4),
  wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
  rating DECIMAL(3, 2) DEFAULT 5.0,
  total_rides INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Drivers Table
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_picture_url TEXT,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_model VARCHAR(100),
  vehicle_year INT,
  vehicle_color VARCHAR(50),
  vehicle_plate VARCHAR(20) UNIQUE,
  vehicle_photo_url TEXT,
  bank_account VARCHAR(255),
  payment_method_id VARCHAR(255),
  rating DECIMAL(3, 2) DEFAULT 5.0,
  total_rides INT DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT FALSE,
  current_location GEOGRAPHY(POINT, 4326),
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rides Table
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  pickup_latitude DECIMAL(10, 8) NOT NULL,
  pickup_longitude DECIMAL(11, 8) NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_latitude DECIMAL(10, 8) NOT NULL,
  dropoff_longitude DECIMAL(11, 8) NOT NULL,
  dropoff_address TEXT NOT NULL,
  estimated_distance_km DECIMAL(8, 2),
  estimated_duration_minutes INT,
  estimated_fare DECIMAL(10, 2),
  actual_fare DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  ride_type VARCHAR(50) DEFAULT 'economy',
  scheduled_time TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  cancelled_by VARCHAR(50),
  payment_method VARCHAR(50) DEFAULT 'wallet',
  promo_code VARCHAR(50),
  discount_amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ratings Table
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  rated_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating_score INT NOT NULL CHECK (rating_score >= 1 AND rating_score <= 5),
  comment TEXT,
  categories JSONB,
  is_rider_rating BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  transaction_id VARCHAR(255),
  card_last_four VARCHAR(4),
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Driver Earnings Table
CREATE TABLE driver_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  gross_amount DECIMAL(10, 2),
  commission DECIMAL(10, 2),
  net_amount DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  payout_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ride Tracking (Real-time location updates)
CREATE TABLE ride_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2),
  heading DECIMAL(6, 2),
  accuracy DECIMAL(8, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Support/Issues Table
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  issue_type VARCHAR(100),
  description TEXT,
  status VARCHAR(50) DEFAULT 'open',
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create Indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_drivers_email ON drivers(email);
CREATE INDEX idx_drivers_available ON drivers(is_available);
CREATE INDEX idx_drivers_location ON drivers USING GIST(current_location);
CREATE INDEX idx_rides_rider_id ON rides(rider_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_created_at ON rides(created_at);
CREATE INDEX idx_ratings_ride_id ON ratings(ride_id);
CREATE INDEX idx_payments_ride_id ON payments(ride_id);
CREATE INDEX idx_ride_tracking_ride_id ON ride_tracking(ride_id);
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_driver_id ON support_tickets(driver_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view their own profile" ON users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users FOR UPDATE
  USING (auth.uid()::text = id::text);

-- RLS Policies for Drivers
CREATE POLICY "Drivers can view their own profile" ON drivers FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Drivers can update their own profile" ON drivers FOR UPDATE
  USING (auth.uid()::text = id::text);

-- RLS Policies for Rides
CREATE POLICY "Users can view their rides" ON rides FOR SELECT
  USING (auth.uid()::text = rider_id::text OR auth.uid()::text = driver_id::text);

CREATE POLICY "Users can create rides" ON rides FOR INSERT
  WITH CHECK (auth.uid()::text = rider_id::text);

CREATE POLICY "Drivers can update ride status" ON rides FOR UPDATE
  USING (auth.uid()::text = driver_id::text);
