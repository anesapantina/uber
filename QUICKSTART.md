# Uber MVP - Quick Start Guide

## ⚡ 5-Minute Setup

### Prerequisites
- Node.js 16+ installed
- Expo Go app on your phone
- Supabase account (free at supabase.com)

### Step 1: Setup Supabase (5 min)
```bash
1. Go to https://supabase.com and create a project
2. Go to SQL Editor
3. Copy all SQL from supabase_schema.sql
4. Paste and run in SQL Editor
5. Copy your project URL and API key
```

### Step 2: Update Credentials (1 min)
```bash
# Open src/services/supabase.ts
# Replace:
SUPABASE_URL = 'https://your-project.supabase.co'
SUPABASE_ANON_KEY = 'your-anon-key'
```

### Step 3: Run the App (2 min)
```bash
npm install  # if not done already
npm start
# Scan QR code with Expo Go app
```

## 🧪 Testing

### Test as Rider
1. Email: `rider@example.com`
2. Password: `password123`
3. Click "Request a Ride"
4. Enter pickup/dropoff
5. Wait for driver acceptance

### Test as Driver
1. Email: `driver@example.com`
2. Password: `password123`
3. Toggle "On Duty"
4. Accept nearby rides
5. Complete and earn

## 📱 App Flow

### Rider App
```
Login → Request Ride → Track Driver → Rate Driver
```

### Driver App
```
Login → Toggle On Duty → View Rides → Accept → Complete
```

## 🎯 Key Features

✅ User authentication (Supabase Auth)
✅ Ride requests with fare estimation
✅ Real-time ride tracking
✅ Driver availability management
✅ Rating system
✅ Payment tracking
✅ Earnings dashboard (driver)

## 🔧 File Structure

```
src/
├── services/supabase.ts      ← All API calls
├── screens/
│   ├── auth/LoginScreen.tsx
│   ├── rider/
│   │   ├── RideRequestScreen.tsx
│   │   ├── RideTrackingScreen.tsx
│   │   └── RideRatingScreen.tsx
│   └── driver/
│       ├── AvailableRidesScreen.tsx
│       └── ActiveRideScreen.tsx
├── navigation/RootNavigator.tsx
└── store/store.ts             ← State management
```

## 🚨 Common Issues

**No rides showing?**
- Make sure driver is "On Duty"
- Check database has rides in table

**Login failing?**
- Verify Supabase credentials are correct
- Check user exists in Supabase Auth

**App crashes?**
- Run: `npm install`
- Check console for errors

## 📚 Next Steps

1. **Add Real Maps**
   - Integrate Google Maps API
   - Show driver location in real-time

2. **Add Push Notifications**
   - Integrate Expo Notifications
   - Notify riders when driver arrives

3. **Add Payment Gateway**
   - Integrate Stripe/PayPal
   - Process payments securely

4. **Deploy**
   - Build APK/IPA
   - Submit to app stores

## 💡 Customization Tips

**Change Pricing:**
```typescript
// src/services/supabase.ts
const basefare = 2.5;      // $2.50
const farePerKm = 1.5;     // $1.50/km
```

**Change Status Colors:**
```typescript
// In any screen file
backgroundColor: '#00c853'  // Green for active
backgroundColor: '#ff5252'  // Red for cancel
```

**Add More Fields:**
1. Modify `supabase_schema.sql`
2. Run SQL in Supabase
3. Update TypeScript interfaces in `store.ts`
4. Update form fields in screens

## 📖 Resources

- React Native: https://reactnative.dev
- Expo: https://expo.dev
- Supabase: https://supabase.com/docs
- React Navigation: https://reactnavigation.org

## 🤝 Support

- Check SUPABASE_SETUP.md for database help
- Check README.md for feature details
- Review src/services/supabase.ts for API usage

---

**Ready to launch?** 🚀 Start with `npm start`!
