# Uber MVP - Deployment Guide

## Prerequisites
- Node.js 16+
- Expo Account (https://expo.dev)
- Supabase Account (https://supabase.com)
- EAS CLI installed: `npm install -g eas-cli`

## Local Testing

### Expo Go (Easiest)
```bash
npm start
# Scan QR code with Expo Go app on your phone
```

### Android Emulator
```bash
npm run android
# Requires Android Studio
```

### iOS Simulator
```bash
npm run ios
# Requires Xcode (macOS only)
```

## Production Build

### Setup EAS

```bash
# Login to Expo
eas login

# Configure project
eas build:configure
```

### Build for Android

```bash
# Development build (for testing)
eas build --platform android --profile preview

# Production APK
eas build --platform android --profile production

# Production AAB (for Play Store)
eas build --platform android --profile production --release-channel production
```

### Build for iOS

```bash
# Development build
eas build --platform ios --profile preview

# Production for TestFlight
eas build --platform ios --profile production

# Production for App Store
eas build --platform ios --profile production --release-channel production
```

### Download Builds
After build completes:
- Check status: `eas build:list`
- Builds are available in Expo Dashboard
- Download APK/IPA from build details

## App Store Submission

### Android (Google Play Store)

#### Preparation
1. Create Google Play Developer account ($25 one-time)
2. Create app in Google Play Console
3. Generate signing key:
```bash
eas credentials
# Follow prompts to generate Android signing key
```

#### Submission Steps
1. Build AAB for production
2. Upload to Google Play Console
3. Fill app details:
   - Title, description
   - Screenshots
   - Category
   - Content rating
4. Add pricing (free or paid)
5. Review and submit

### iOS (App Store)

#### Preparation
1. Create Apple Developer account ($99/year)
2. Create App ID in Apple Developer Console
3. Configure signing:
```bash
eas credentials
# Follow prompts for iOS certificates and provisioning profiles
```

#### Submission Steps
1. Build for production
2. Use Transporter to upload to App Store Connect
3. Fill app information:
   - Title, description
   - Keywords
   - Screenshots
   - Category
4. Set pricing and availability
5. Submit for review (24-48 hours)

## Environment Setup for Production

Create `.env.production`:
```
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=your-prod-anon-key

ENVIRONMENT=production
```

Update `app.json`:
```json
{
  "expo": {
    "name": "Uber",
    "slug": "uber-mvp",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTabletMode": false,
      "bundleIdentifier": "com.yourcompany.uber"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#000000"
      },
      "package": "com.yourcompany.uber"
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Uber to access your location while using the app."
        }
      ]
    ]
  }
}
```

## Production Checklist

### Code
- [ ] Remove all console.logs
- [ ] Remove demo/test code
- [ ] Update all API endpoints to production
- [ ] Enable error tracking (Sentry, LogRocket)
- [ ] Add analytics (Mixpanel, Firebase)

### Backend
- [ ] Update Supabase RLS policies
- [ ] Setup database backups
- [ ] Configure rate limiting
- [ ] Enable HTTPS enforcement
- [ ] Setup monitoring and alerts

### App
- [ ] Update app name and version
- [ ] Add real app icon
- [ ] Add splash screen
- [ ] Update privacy policy URL
- [ ] Update terms of service URL
- [ ] Test all features on real devices

### Security
- [ ] Never commit `.env` files
- [ ] Use environment variables for all secrets
- [ ] Enable 2FA for all accounts
- [ ] Review RLS policies
- [ ] Setup API key rotation
- [ ] Implement request signing

### Testing
- [ ] Test on multiple devices
- [ ] Test on older Android/iOS versions
- [ ] Test with poor network conditions
- [ ] Test offline functionality
- [ ] Load test backend
- [ ] Security audit

## Deployment Script

Create `deploy.sh`:
```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Check environment
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production not found"
    exit 1
fi

# Clean install
rm -rf node_modules package-lock.json
npm install

# Lint and type check
npm run lint
npm run type-check

# Build
echo "📦 Building for production..."
eas build --platform android --profile production
eas build --platform ios --profile production

echo "✅ Build complete! Uploads available in Expo Dashboard"
```

## Monitoring & Updates

### Monitor Production
```bash
# View build logs
eas build:logs --id <build-id>

# Monitor crash reports (integrate Sentry)
# View in Sentry Dashboard

# Monitor analytics
# View in analytics dashboard
```

### Update App
```bash
# JavaScript/TypeScript updates
# Push OTA (Over-The-Air) update
eas update
# Users get update without redeploying

# Native code updates
# Requires new build and store resubmission
eas build
```

## Rollback Process

### Rollback OTA Update
```bash
# List deployments
eas update:list

# Rollback to previous version
eas update:republish --branch production --message "Rollback fix"
```

### Rollback Build
1. Upload previous build to store
2. Increment version number
3. Resubmit for review

## Post-Launch

### Week 1
- Monitor crash reports
- Fix critical issues
- Respond to user feedback
- Monitor server load

### Month 1
- Gather user feedback
- Fix bugs and polish
- Optimize performance
- Plan next features

### Ongoing
- Monitor analytics
- Fix reported bugs
- Security updates
- Feature improvements

## Support Resources

- **EAS Documentation**: https://docs.expo.dev/eas
- **Google Play Docs**: https://developer.android.com/distribute
- **Apple Developer**: https://developer.apple.com
- **Supabase**: https://supabase.com/docs

## Troubleshooting

### Build Fails
```bash
# Clear cache
rm -rf .expo

# Reinstall dependencies
rm -rf node_modules
npm install

# Try again
eas build --platform android
```

### Signing Issues
```bash
# Reset credentials
eas credentials:configure

# Delete and regenerate
eas credentials --platform android --delete
```

### Store Submission Rejected
- Check rejection reason in console
- Fix issues in app
- Resubmit in 24 hours

---

**You're ready to launch!** Deploy with confidence and monitor for issues. 🚀
