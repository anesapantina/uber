# Uber MVP - React Native + Expo + Supabase

A complete Uber MVP built with React Native, Expo, and Supabase with separate apps for riders and drivers.

## Features

### Core Features
- ✅ User authentication (Rider & Driver)
- ✅ Ride requests with fare estimation
- ✅ Real-time ride tracking
- ✅ Driver availability management
- ✅ Accept/manage rides
- ✅ Rating system
- ✅ Payment integration ready

## Project Structure

```
uber/
├── src/
│   ├── services/
│   │   └── supabase.ts          # All Supabase API calls
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx
│   │   ├── rider/
│   │   │   ├── RideRequestScreen.tsx
│   │   │   ├── RideTrackingScreen.tsx
│   │   │   └── RideRatingScreen.tsx
│   │   └── driver/
│   │       ├── AvailableRidesScreen.tsx
│   │       └── ActiveRideScreen.tsx
│   ├── navigation/
│   │   └── RootNavigator.tsx    # Navigation setup
│   ├── store/
│   │   └── store.ts             # Zustand state management
│   └── utils/
├── supabase_schema.sql           # Database setup file
└── app.json
```

## Setup Instructions

### 1. Install Dependencies

All dependencies are already in `package.json`. The project uses:
- React Native & Expo
- React Navigation
- Supabase JS Client
- Zustand (state management)
- Expo Location
- React Native Maps (optional, for maps view)

### 2. Setup Supabase

1. **Create a Supabase Project**
   - Go to https://supabase.com
   - Create a new project
   - Get your project URL and Anon Key

2. **Setup Database**
   - Go to SQL Editor in Supabase
   - Copy the content from `supabase_schema.sql`
   - Run the SQL queries in Supabase

3. **Update Supabase Credentials**
   - Open `src/services/supabase.ts`
   - Replace `SUPABASE_URL` and `SUPABASE_ANON_KEY` with your credentials

### 3. Run the App

```bash
# Install dependencies (if not already done)
npm install

# Start Expo development server
npm start

# For different platforms
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Web browser
```

### 4. Test the App

**Login Credentials (Demo):**
- **Rider**: Use any email without "driver" in it
  - Example: `rider@example.com`
- **Driver**: Use an email with "driver" in it
  - Example: `driver@example.com`
- **Password**: Any password (demo setup)

**Default Credentials After Database Setup:**
```
rider@example.com / password123
driver@example.com / password123
```

## Database Schema Overview

### Tables

1. **users** - Rider profiles
   - Basic profile info, rating, payment methods, wallet balance

2. **drivers** - Driver profiles
   - License, vehicle info, location, availability, earnings

3. **rides** - Ride information
   - Pickup/dropoff locations, fare, status, timestamps

4. **ratings** - User ratings
   - Rider and driver ratings with comments

5. **payments** - Payment records
   - Transaction details and status

6. **driver_earnings** - Driver earnings tracking
   - Commission tracking and payouts

7. **ride_tracking** - Real-time location data
   - Driver location updates during rides

8. **support_tickets** - Support tickets
   - Issue reporting and resolution

## Key Features Implementation

### Authentication Flow
1. User selects Rider or Driver mode
2. Signs up/logs in via Supabase Auth
3. Email with "driver" = driver account, others = rider
4. User profile created in respective table

### Rider Flow
1. Request ride with pickup/dropoff
2. System calculates fare estimate using distance
3. Rider waits for driver acceptance
4. Real-time tracking once driver accepts
5. Rate driver after completion

### Driver Flow
1. Toggle "On Duty" to see available rides
2. View nearby ride requests
3. Accept ride to start navigation
4. Update status: Start → Complete
5. Earn money (tracked in driver_earnings)

## Customization

### Change Base Fare & Rates
In `src/services/supabase.ts`, update `riderService.requestRide`:
```typescript
const farePerKm = 1.5;        // $1.50 per km
const baseFare = 2.5;         // $2.50 base
const estimatedFare = baseFare + distance * farePerKm;
```

### Add Real Maps
Replace mock coordinates in screens with actual geolocation:
```typescript
import * as Location from 'expo-location';

const location = await Location.getCurrentPositionAsync({});
const lat = location.coords.latitude;
const lng = location.coords.longitude;
```

### Implement Real Payment Processing
Integrate with Stripe/PayPal in `paymentService.createPayment()`:
```typescript
// Add Stripe API call here
```

## Environment Variables

Create a `.env` file:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

## Running on Expo Go

1. Install Expo Go app on your phone
2. Run `npm start`
3. Scan QR code with Expo Go
4. App will load on your device

## Production Checklist

- [ ] Setup proper authentication with email verification
- [ ] Integrate real payment processor (Stripe/PayPal)
- [ ] Implement real maps with Google Maps API
- [ ] Add push notifications (Expo Notifications)
- [ ] Implement WebSockets for real-time updates
- [ ] Setup image storage (Supabase Storage)
- [ ] Add analytics
- [ ] Implement proper error handling
- [ ] Add comprehensive testing
- [ ] Setup CI/CD pipeline

## API Services

All API calls are in `src/services/supabase.ts`:

- **authService** - Login, signup, logout
- **riderService** - Request rides, track, cancel, history
- **driverService** - Get rides, accept, update status, earnings
- **ratingService** - Submit and retrieve ratings
- **paymentService** - Payment tracking

## State Management

Using Zustand for simple, efficient state:
- `useAuthStore` - User and authentication
- `useRiderStore` - Rider-specific state
- `useDriverStore` - Driver-specific state

## Troubleshooting

**No rides showing up?**
- Make sure driver is "On Duty"
- Check if rides exist in database
- Verify location coordinates are reasonable

**Supabase connection errors?**
- Verify URL and API key are correct
- Check Supabase project is active
- Verify database tables exist

**Location not updating?**
- Grant location permissions
- Check `expo-location` is properly installed

## Support

For issues with:
- **React Native/Expo**: Check Expo docs
- **Supabase**: Visit supabase.com/docs
- **Navigation**: React Navigation docs

---

Built with ❤️ for Uber MVP
