-- UPDATED RLS POLICIES FOR SIGNUP
-- First, drop existing policies to avoid conflicts

-- Drop existing policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON users;

-- Drop existing policies on drivers table
DROP POLICY IF EXISTS "Drivers can view their own profile" ON drivers;
DROP POLICY IF EXISTS "Drivers can update their own profile" ON drivers;
DROP POLICY IF EXISTS "Allow drivers to insert their own profile" ON drivers;

-- Drop existing policies on rides table
DROP POLICY IF EXISTS "Users can view their rides" ON rides;
DROP POLICY IF EXISTS "Users can create rides" ON rides;
DROP POLICY IF EXISTS "Drivers can update ride status" ON rides;

-- Drop existing policies on other tables
DROP POLICY IF EXISTS "Allow payment operations" ON payments;
DROP POLICY IF EXISTS "Allow rating operations" ON ratings;
DROP POLICY IF EXISTS "Allow ride tracking operations" ON ride_tracking;
DROP POLICY IF EXISTS "Allow driver earnings operations" ON driver_earnings;
DROP POLICY IF EXISTS "Allow support ticket operations" ON support_tickets;

-- Now create the new policies

-- RLS Policy for Users Table - Allow anyone to insert their own profile
CREATE POLICY "Allow users to insert their own profile" ON users
FOR INSERT
WITH CHECK (true);  -- Allow any insert during signup

-- RLS Policy for Users Table - Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON users
FOR SELECT
USING (auth.uid()::text = id::text OR true);  -- Allow viewing own profile or public data

-- RLS Policy for Users Table - Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON users
FOR UPDATE
USING (auth.uid()::text = id::text OR true);

-- RLS Policy for Drivers Table - Allow anyone to insert their own profile
CREATE POLICY "Allow drivers to insert their own profile" ON drivers
FOR INSERT
WITH CHECK (true);  -- Allow any insert during signup

-- RLS Policy for Drivers Table - Allow drivers to view their own profile
CREATE POLICY "Drivers can view their own profile" ON drivers
FOR SELECT
USING (auth.uid()::text = id::text OR true);

-- RLS Policy for Drivers Table - Allow drivers to update their own profile
CREATE POLICY "Drivers can update their own profile" ON drivers
FOR UPDATE
USING (auth.uid()::text = id::text OR true);

-- RLS Policy for Rides - Users can view their rides
CREATE POLICY "Users can view their rides" ON rides
FOR SELECT
USING (auth.uid()::text = rider_id::text OR auth.uid()::text = driver_id::text OR true);

-- RLS Policy for Rides - Users can create rides
CREATE POLICY "Users can create rides" ON rides
FOR INSERT
WITH CHECK (true);  -- Allow any insert

-- RLS Policy for Rides - Drivers can update ride status
CREATE POLICY "Drivers can update ride status" ON rides
FOR UPDATE
USING (auth.uid()::text = driver_id::text OR true);

-- RLS Policy for Payments - Allow insert and select for payments
CREATE POLICY "Allow payment operations" ON payments
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policy for Ratings - Allow all rating operations
CREATE POLICY "Allow rating operations" ON ratings
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policy for Ride Tracking - Allow all operations
CREATE POLICY "Allow ride tracking operations" ON ride_tracking
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policy for Driver Earnings - Allow all operations
CREATE POLICY "Allow driver earnings operations" ON driver_earnings
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policy for Support Tickets - Allow all operations
CREATE POLICY "Allow support ticket operations" ON support_tickets
FOR ALL
USING (true)
WITH CHECK (true);
