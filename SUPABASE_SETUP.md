# Supabase Setup Guide

## Step 1: Create Supabase Account & Project

1. Go to https://supabase.com
2. Click "Sign Up" and create an account
3. Create a new project
   - Project name: `uber-mvp`
   - Region: Choose closest to your location
   - Database password: Set a strong password
4. Wait for project initialization (2-3 minutes)

## Step 2: Get Your Credentials

1. Go to **Settings** → **API**
2. You'll see:
   - **Project URL** (supabase_url)
   - **Anon/Public Key** (supabase_anon_key)

## Step 3: Setup Database Schema

1. Go to **SQL Editor**
2. Click **New Query** → **Blank Query**
3. Copy entire content from `supabase_schema.sql`
4. Paste into the SQL editor
5. Click **Run** button
6. Wait for all queries to complete

## Step 4: Update App Configuration

1. Open `src/services/supabase.ts`
2. Replace:
   ```typescript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```
   With your actual credentials from Step 2

## Step 5: Create Test Users

1. Go to **Authentication** → **Users**
2. Click **Add User** and create test accounts:

   **Rider Account:**
   - Email: `rider@example.com`
   - Password: `password123`

   **Driver Account:**
   - Email: `driver@example.com`
   - Password: `password123`

## Step 6: Verify Setup

1. Go to **Table Editor**
2. You should see all these tables:
   - users
   - drivers
   - rides
   - ratings
   - payments
   - driver_earnings
   - ride_tracking
   - support_tickets

## Database Structure

### users (Riders)
```sql
- id (UUID)
- email (varchar)
- first_name, last_name
- phone_number
- profile_picture_url
- rating (0-5)
- total_rides
- wallet_balance
```

### drivers
```sql
- id (UUID)
- email (varchar)
- license_number
- vehicle_model, vehicle_plate
- current_latitude, current_longitude
- is_available (boolean)
- is_active (boolean)
- rating (0-5)
- total_earnings
```

### rides
```sql
- id (UUID)
- rider_id (FK → users)
- driver_id (FK → drivers)
- pickup_latitude, pickup_longitude
- dropoff_latitude, dropoff_longitude
- status: 'pending'|'accepted'|'in_progress'|'completed'|'cancelled'
- estimated_fare
- actual_fare
```

### ratings
```sql
- id (UUID)
- ride_id (FK → rides)
- rated_by_id (FK → users)
- rated_user_id (FK → users)
- rating_score (1-5)
- comment
```

### payments
```sql
- id (UUID)
- ride_id (FK → rides)
- user_id (FK → users)
- amount
- payment_method: 'wallet'|'card'|'cash'
- payment_status: 'pending'|'completed'|'failed'
```

## Row Level Security (RLS)

The schema includes RLS policies:
- Users can only see their own profile
- Users can only see rides they're involved in
- Drivers can only update their own data

## Testing Checklist

- [ ] Can login with test rider account
- [ ] Can login with test driver account
- [ ] Can request a ride as rider
- [ ] Can see rides as driver
- [ ] Can accept ride as driver
- [ ] Can rate after ride completion
- [ ] Database tables are populated

## Troubleshooting

### Connection Error
- Verify URL format: `https://your-project.supabase.co`
- Check API key is correct (Anon/Public key, not service role)
- Ensure RLS policies aren't blocking access

### Authentication Error
- Verify user exists in Authentication → Users
- Check email and password are correct
- Ensure email is confirmed (if required)

### No Data Appearing
- Check Row Level Security (RLS) is not too restrictive
- Verify you're logged in with correct user
- Check data filters in queries

### Database Full
- Check if you have storage limits
- Delete old test data if needed

## Optional: Enable Realtime

For real-time updates (recommended):

1. Go to **Database** → **Replication**
2. Click on each table
3. Enable Realtime toggle

This allows:
- Real-time ride updates
- Live driver location tracking
- Instant notifications

## Security Notes

- **Never** commit API keys to git
- Use `.env` for sensitive data in production
- RLS is enabled by default for all tables
- Review policies before going to production
- Consider adding 2FA for admin account

## Next Steps

1. ✅ Setup Supabase project
2. ✅ Create database schema
3. ✅ Add test users
4. ✅ Update app credentials
5. Run the app and test!

For more help: https://supabase.com/docs
