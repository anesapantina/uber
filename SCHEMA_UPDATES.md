# Supabase Service Update - Schema Alignment

## Changes Made

Your `supabase.ts` service file has been completely updated to match your database schema exactly.

### 1. **User/Rider Fields Updated**
The `signUpRider` function now includes all fields from your users table:
- `profile_picture_url`
- `home_address` & `work_address`
- `saved_places`
- `payment_method_id` & `card_last_four`
- `wallet_balance`
- Proper timestamp handling (`created_at`, `updated_at`)

### 2. **Driver Fields Updated**
The `signUpDriver` function now includes all driver table fields:
- `profile_picture_url` & `vehicle_photo_url`
- `bank_account` & `payment_method_id`
- `is_active` & `verified` flags
- `current_latitude` & `current_longitude` (location tracking)
- Proper null/default value initialization

### 3. **Ride Service Enhancements**
- `requestRide()` now accepts `rideType` and `paymentMethod` parameters
- Automatic `updated_at` timestamp management
- Better join queries with rider and driver details
- Support for `discount_amount` field

### 4. **Driver Service Enhancements**
- `setDriverAvailability()` now properly sets both `is_available` and `is_active`
- `getAvailableRides()` filters for rides with no driver (`.is('driver_id', null)`)
- `completeRide()` automatically creates:
  - Payment records
  - Driver earnings with 20% commission calculation
- New `getDriverRideHistory()` for ride history with rider info
- New `getTotalEarnings()` for earnings summary
- Real-time tracking to `ride_tracking` table when location updates

### 5. **Rating Service Enhancements**
- Auto-updates user/driver rating after each rating creation
- New `getAverageRating()` function
- Returns rating data with rater and ride information

### 6. **Payment Service Enhancements**
- New `getTotalSpent()` to get user's total spending
- Payment history includes ride details (addresses, completion time)
- Automatic transaction ID generation

### 7. **New Support Service**
Completely new service for support tickets:
- `createTicket()` - Create issues (can be for users or drivers)
- `getTickets()` - Retrieve tickets for a user or driver

### 8. **Type Definitions**
Added TypeScript interfaces for:
- `User` (riders)
- `Driver`
- `Ride`

### 9. **Database Schema Compliance**
All functions now properly handle:
- ISO timestamp formatting (`.toISOString()`)
- Null/undefined values
- Relationship joins with proper select syntax
- RLS (Row Level Security) compatibility
- All table fields from your schema

### Key Features
✅ Automatic timestamps with `updated_at`  
✅ Commission calculation (20%) on ride completion  
✅ Real-time ride tracking location logging  
✅ Average rating auto-calculation  
✅ Payment/transaction handling  
✅ Support ticket management  
✅ Wallet balance management  

## Usage Example

```typescript
// Signup as driver
const result = await authService.signUpDriver(
  'driver@example.com',
  'password123',
  'John',
  'Doe',
  '+1234567890',
  'DL12345',
  'Toyota Camry',
  2022,
  'Silver',
  'ABC-123'
);

// Request a ride as rider
const ride = await riderService.requestRide(
  userId,
  40.7128, -74.0060,  // pickup coords
  'Times Square, NYC',
  40.7580, -73.9855,  // dropoff coords
  'Central Park, NYC',
  2.5,
  15,
  $25.50,
  'economy',
  'wallet'
);

// Accept and complete
await driverService.acceptRide(rideId, driverId);
await driverService.completeRide(rideId, $25.50); // Auto-creates payment & earnings
```

All services are now fully aligned with your Supabase database schema!
