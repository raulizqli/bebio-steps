# Bebio Steps Mobile App

React Native mobile application for iOS and Android built with Expo.

## Features

- User authentication (login/register)
- Baby profile management
- Feeding tracking with detailed stats
- Sleep monitoring
- Health records (symptoms, diseases, medications)
- Mood tracking
- Share access with nannies and family members
- Push notifications for goal tracking
- Beautiful, modern UI

## Tech Stack

- React Native with Expo
- TypeScript
- Expo Router for navigation
- Axios for API calls
- AsyncStorage for local data
- Context API for state management

## Installation

```bash
npm install
```

## Running the App

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Web
```bash
npm run web
```

## Building

### Development Build
```bash
npx expo prebuild
```

### Production Build
```bash
eas build --platform ios
eas build --platform android
```

## Project Structure

```
mobile/
├── app/                    # App routes (Expo Router)
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab screens
│   └── _layout.tsx        # Root layout
├── src/
│   ├── config/            # Configuration
│   ├── contexts/          # React contexts
│   ├── services/          # API services
│   └── components/        # Reusable components
└── assets/                # Images and fonts
```

## Features Overview

### Authentication
- Email/password registration and login
- JWT token authentication
- Secure token storage

### Baby Management
- Create and manage multiple baby profiles
- Switch between babies
- Track growth metrics

### Tracking Features
- **Feeding**: Breast, bottle, solid foods
- **Sleep**: Duration, quality, location
- **Health**: Symptoms, diseases, medications
- **Mood**: Emotional state tracking

### Sharing
- Generate share codes
- Time-limited access for nannies
- Granular permissions control
- Revoke access anytime

### Notifications
- Goal tracking alerts
- Feeding reminders
- Sleep schedule notifications
