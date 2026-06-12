# 👁️ TheGymEye — Gym Management & Fitness Tracker

**TheGymEye** is a premium, feature-rich React Native mobile application built on the Expo framework, fully integrated with a Firebase backend. It provides a robust solution for gym owners, trainers, and members to connect, track fitness metrics, manage memberships, and coordinate custom workout and nutrition plans.

---

## 🌟 Key Features

### 🔐 1. Authentication & Role-Based Workflows
- **Secure Authentication**: Integrated via Firebase and mapped directly to custom Firestore `authUsers` profiles.
- **Role System**: Supports `owner`, `admin`, `trainer`, and `member` roles.
- **Dynamic Routing**: Automatic screen/navigation selection based on the active user's role and clan status.

### 🛡️ 2. Gym Clans Community System
- **Invite-Only Communities**: Gym owners can create a "Clan" representing their gym community.
- **6-Character Invite Codes**: Owners receive a unique 6-character code to share with members.
- **Easy Onboarding**: New members enter the invite code to join a clan and immediately gain access to trainer-assigned programs.
- **Centralized Admin Control**: Owners and admins manage profiles, edit memberships, and view analytics specifically for their clan.

### 📊 3. Interactive Member & Admin Dashboards
- **Member Dashboard**:
  - Live membership status tracking (Active, Expired, Pending).
  - High-level summaries of today's assigned workout plans and diet charts.
  - Quick action buttons to log new workout sessions.
- **Admin/Owner Dashboard**:
  - Analytics cards displaying total members, active memberships, and pending/expired accounts.
  - Active clan member directories with search, filter, and management capabilities.
  - Quick access to notification broadcasts and renewal logs.

### 💪 4. Full-Featured Fitness Logger & Templates
- **Custom Exercises**: Log workouts specifying sets, reps, weight, duration, rest times, and notes.
- **Fitness Plan Templates**: Trainers assign weekly schedules (`WorkoutTemplates`) mapped to specific days of the week (Sunday–Saturday).
- **History & Progress Logs**: Tracks duration, calories burned, and logs historical workout details.

### 🍎 5. Dynamic Nutrition & Diet Charts
- **Target Calories**: Set dietary goals with exact caloric thresholds.
- **Macronutrient Tracking**: Break down meals into protein, carbs, and fat distributions.
- **Meal Schedule**: Mapped by specific times (HH:MM) to structure daily food consumption.

### 🔔 6. Intelligent Renewal Notification Engine
- **Automated Alerts**: Checks and triggers alerts based on membership expiry status.
- **Reminder Thresholds**:
  - 📅 **30-Day Reminder** (Orange): Gentle notification before expiry.
  - ⚠️ **7-Day Urgent Alert** (Red): High priority notification for upcoming expiration.
  - ❌ **Expired Notification** (Red): Alert when membership has expired.
- **In-App Badges**: Features dynamic unread counts and read/delete tracking on user devices.

---

## 🎨 Design System & Theme

TheGymEye features a centralized design system located in [theme.ts](file:///Users/bhuvanmadhur/Downloads/Projects/Gym_App/src/config/theme.ts) to maintain visual consistency:

- **Color Palette**: Sleek Indigo/Purple primary gradients (`#6C63FF` to `#764ba2`), soft backgrounds, and distinct status indicators (Success, Warning, Danger).
- **Linear Gradients**: Custom presets for dashboards, workouts, diet plans, and motivational banners.
- **Responsive Layouts**: Fully optimized for iOS, Android, and Web platforms using standard styling metrics, shadow rules, and viewport adjustments.

---

## 🛠️ Technology Stack

- **Frontend Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 53)
- **Programming Language**: [TypeScript](https://www.typescriptlang.org/) (Strictly typed schemas)
- **Navigation**: [React Navigation v7](https://reactnavigation.org/) (Bottom tabs, stacks)
- **Database & Backend**: [Firebase (Firestore)](https://firebase.google.com/)
- **UI Components**: Custom layouts with [React Native Paper](https://reactnativepaper.com/) & [Ionicons](https://icons.expo.fyi/)
- **State Management**: React Context API (`AuthContext`)

---

## 📂 Project Structure

```
thegymeye/
├── .expo/                  # Metro/Expo cache
├── assets/                 # Images, icons, and static assets
├── src/
│   ├── components/         # Shared UI components (RefreshHeader, NotificationBadge, etc.)
│   ├── config/             # Config files
│   │   ├── environment.ts  # Central app environment vars & feature flags
│   │   ├── firebase.ts     # Firebase initializations
│   │   └── theme.ts        # Design tokens: Colors, typography, spacing, shadows
│   ├── context/            # React Context Providers
│   │   └── AuthContext.tsx # User session, clan metadata, and login handlers
│   ├── navigation/         # Navigation setups (AppNavigator.tsx)
│   ├── screens/            # Application Screens
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── JoinClanScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── WorkoutsScreen.tsx
│   │   ├── AddWorkoutScreen.tsx
│   │   ├── FitnessPlanScreen.tsx
│   │   ├── DietChartScreen.tsx
│   │   ├── NotificationsScreen.tsx
│   │   └── admin/          # Admin-specific management screens
│   │       ├── AdminDashboardScreen.tsx
│   │       ├── AdminUsersScreen.tsx
│   │       ├── AdminEditUserScreen.tsx
│   │       ├── AdminWorkoutsScreen.tsx
│   │       ├── AdminEditWorkoutScreen.tsx
│   │       ├── AdminFitnessPlansScreen.tsx
│   │       ├── AdminEditFitnessPlanScreen.tsx
│   │       ├── AdminDietChartsScreen.tsx
│   │       ├── AdminEditDietChartScreen.tsx
│   │       ├── AdminProgressScreen.tsx
│   │       ├── AdminEditProgressScreen.tsx
│   │       └── AdminNotificationsScreen.tsx
│   ├── services/           # Backend Data Services
│   │   ├── authService.ts         # User auth operations
│   │   ├── database.ts            # Core Firestore helper references
│   │   ├── firebaseService.ts     # CRUD for members, workouts, diets, clans
│   │   └── notificationService.ts # Push and local alert logic
│   └── types/              # TypeScript Types & Interfaces
│       ├── index.ts        # Data structures (Clan, Member, Workout, DietChart)
│       └── navigation.ts   # Navigation Stack configurations
├── App.tsx                 # App Root
├── app.json                # Expo Config
├── eas.json                # EAS Build Config
├── firebase.json           # Firebase Config
├── firestore.rules         # Security Rules for database operations
└── package.json            # Dependencies and script definitions
```

---

## 🚀 Installation & Setup

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- Expo Go App on your mobile device (for local testing)

### 2. Clone the Repository
```bash
git clone https://github.com/bhuva-sun/Gym_App.git
cd Gym_App
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Firebase Configuration
1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** and **Authentication** (Email/Password provider).
3. Register a Web App in Firebase settings and copy the configuration keys.
4. Replace the placeholders in `src/config/environment.ts` with your credentials:
   ```typescript
   export const ENV = {
     FIREBASE: {
       API_KEY: "your-api-key",
       AUTH_DOMAIN: "your-project-id.firebaseapp.com",
       PROJECT_ID: "your-project-id",
       STORAGE_BUCKET: "your-project-id.appspot.com",
       MESSAGING_SENDER_ID: "your-messaging-sender-id",
       APP_ID: "your-app-id"
     },
     // ... other features
   };
   ```

### 5. Deploy Database Security Rules
Deploy firestore security rules to restrict read/write access based on role permissions:
```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules
```

### 6. Run the App
Start the Expo Metro bundler:
```bash
npm start
```
- Scan the generated QR code using the **Expo Go** app on iOS or Android.
- Press `w` to run the web simulator.
- Press `a` or `i` to open emulator environments.

---

## 🔒 Security Rules & Data Security
All database actions are guarded by Firestore Security Rules defined in [firestore.rules](file:///Users/bhuvanmadhur/Downloads/Projects/Gym_App/firestore.rules).
- **Members**: Can read and write only their own records.
- **Clans**: Users can only read information corresponding to their assigned `clanId`.
- **Admins/Owners**: Can view and modify records matching their clan's ID.

---

## 💡 Troubleshooting

- **Metro Cache Clearing**:
  If you face bundle or loading errors, start Expo with a cleared cache:
  ```bash
  npx expo start --clear
  ```
- **Firebase Connection Issues**:
  Check your firestore.rules or verify that the active network does not block Firebase ports. You can run connection tests with:
  ```bash
  node test-firebase-connection.js
  ```
- **Permission Denied in Firestore**:
  Ensure that your test user document in the `authUsers` collection has a valid `clanId` that matches the document they are trying to read.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.