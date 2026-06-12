# Firebase Setup Guide — TheGymEye

This guide walks you through setting up Firebase for the TheGymEye gym management application.

## Prerequisites

- A Google account
- Node.js (v16+) and npm installed
- The TheGymEye project cloned and dependencies installed (`npm install`)

---

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Enter a project name (e.g., `thegymeye-app`)
4. Optionally enable Google Analytics, then click **Create project**
5. Wait for the project to be provisioned, then click **Continue**

---

## Step 2: Register a Web App

1. In your Firebase project dashboard, click the **Web** icon (`</>`) to add a web app
2. Enter an app nickname (e.g., `TheGymEye Web`)
3. You do **not** need to enable Firebase Hosting at this step
4. Click **Register app**
5. Copy the Firebase configuration object — you will need these values in the next step:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Step 3: Configure the App

Open `src/config/environment.ts` and replace the Firebase configuration values with your own:

```typescript
export const ENV = {
  FIREBASE: {
    API_KEY: "your-api-key",
    AUTH_DOMAIN: "your-project-id.firebaseapp.com",
    PROJECT_ID: "your-project-id",
    STORAGE_BUCKET: "your-project-id.firebasestorage.app",
    MESSAGING_SENDER_ID: "your-messaging-sender-id",
    APP_ID: "your-app-id"
  },
  // ...
};
```

---

## Step 4: Enable Cloud Firestore

1. In the Firebase Console, go to **Build → Firestore Database**
2. Click **Create database**
3. Choose your preferred location (e.g., `us-central1` or `asia-south1`)
4. Select **Start in test mode** for development (you will deploy proper rules later)
5. Click **Enable**

### Firestore Collections

The app uses the following collections (created automatically on first use):

| Collection       | Description                        |
|------------------|------------------------------------|
| `members`        | Gym member profiles & memberships  |
| `authUsers`      | Authentication user records        |
| `workouts`       | Individual workout sessions        |
| `progressLogs`   | Body metrics & progress data       |
| `fitnessPlans`   | Personalized workout plans         |
| `dietCharts`     | Personalized meal plans            |
| `notifications`  | User notifications                 |

---

## Step 5: Enable Authentication

1. In the Firebase Console, go to **Build → Authentication**
2. Click **Get started**
3. Under **Sign-in method**, enable **Email/Password**
4. Click **Save**

> **Note:** The app currently uses a custom Firestore-based authentication system (`authUsers` collection) rather than Firebase Auth's built-in user management. Firebase Auth is initialized but the actual login/registration is handled via Firestore document lookups.

---

## Step 6: Deploy Firestore Security Rules

The project includes a `firestore.rules` file. Deploy it using the Firebase CLI:

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
npx firebase-tools login

# Initialize Firebase in the project (select Firestore)
npx firebase-tools init firestore

# Deploy the rules
npx firebase-tools deploy --only firestore:rules
```

---

## Step 7: Initialize Sample Data

When you first launch the app and log in, sample data is automatically created if the `members` collection is empty. This includes:

- **2 sample members** (John Doe, Jane Smith)
- **1 admin user** (admin@gymapp.com)
- **Sample workouts and progress logs**

### Default Test Accounts

| Role   | Email              | Password     |
|--------|--------------------|--------------|
| Admin  | admin@gymapp.com   | admin123     |
| Member | john@example.com   | password123  |
| Member | jane@example.com   | password123  |

---

## Step 8: Run the App

```bash
# Start the Expo development server
npm start

# Press 'w' to open in web browser
# Press 'a' for Android emulator
# Press 'i' for iOS simulator
```

---

## Troubleshooting

### "Firebase: No Firebase App has been created"
- Ensure `src/config/environment.ts` has the correct Firebase configuration values
- Check that `src/config/firebase.ts` is importing from the correct path

### "Permission denied" errors in Firestore
- Verify your Firestore security rules allow access
- For development, you can temporarily use open rules:
  ```
  allow read, write: if true;
  ```
- **Important:** Never use open rules in production

### "Network request failed"
- Check your internet connection
- Verify the Firebase project ID and API key are correct
- Ensure the Firestore database region is accessible from your location

### Metro bundler issues
- Clear the cache: `npx expo start --clear`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

---

## Production Considerations

Before deploying to production:

1. **Security Rules**: Replace open test rules with proper per-collection access controls (see `firestore.rules`)
2. **Environment Variables**: Store API keys securely; do not commit them to version control
3. **Firebase App Check**: Enable App Check to protect your backend resources
4. **Firestore Indexes**: Create composite indexes for complex queries if needed
5. **EAS Build**: For push notifications, create a development build with `eas build`
