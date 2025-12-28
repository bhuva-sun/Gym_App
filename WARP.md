# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Key Commands

### Install & Run
- Install dependencies: `npm install`
- Start Expo dev server (Metro bundler): `npm start`
  - From the Expo CLI UI:
    - Press `i` to run on iOS simulator
    - Press `a` to run on Android emulator
    - Or scan the QR code with Expo Go
- Run directly via scripts:
  - iOS: `npm run ios`
  - Android: `npm run android`
  - Web: `npm run web`

### Testing & Linting
This repo currently does **not** define explicit test or lint scripts in `package.json`. Before assuming a test framework exists, check for config files (e.g. `jest.config.*`, `vitest.config.*`) or ask the user how they want tests set up.

### Useful Development Flows
- TypeScript config extends Expo base (`tsconfig.json`), so TS typechecking is handled by the Expo toolchain. For static checks, run `tsc --noEmit` after installing TypeScript globally or add a `"typecheck"` script if needed.
- Firebase configuration is taken from `src/config/environment.ts` via `getFirebaseConfig()` in `src/config/firebase.ts`. When switching Firebase projects, update `ENV.FIREBASE` there.

## High-Level Architecture

### Overview
This is a React Native + Expo app (`App.tsx`) called **TheGymEye** that uses:
- React Navigation for routing and tab/stack navigation
- Firebase Authentication + Firestore for backend data
- Expo services (notifications, camera, media, etc.)
- React Context for auth/session management

The main app tree:
- `App.tsx` wraps everything in `SafeAreaProvider` and `AuthProvider`, then renders `AppNavigator`.
- `src/context/AuthContext.tsx` owns user/auth state and bootstraps Firestore sample data on first run.
- `src/navigation/AppNavigator.tsx` decides between auth flow, member app, and admin app based on `AuthContext.user.role`.

### Navigation & Roles
- `src/types/navigation.ts` defines strong-typed route param lists:
  - `RootStackParamList`: auth stack + member/admin stacks + edit/detail screens
  - `MemberTabParamList`: member bottom tabs
  - `AdminTabParamList`: admin bottom tabs
- `AppNavigator`:
  - If no `user` → stack with `Login` and `Register` screens
  - If `user.role === 'admin'` → admin tab navigator (`AdminTabNavigator`) and admin edit/detail stack screens
  - Else (member) → member tab navigator (`MemberTabNavigator`) plus stack screens for `AddWorkout` and `AddProgress`
- Member tabs (bottom navigation): Dashboard, Profile, Workouts, Progress, Fitness Plan, Diet Chart, Notifications
- Admin tabs: Admin Dashboard, Users, Workouts, Progress, Fitness Plans, Diet Charts, Notifications

### Auth & User Model
- `src/context/AuthContext.tsx`:
  - Tracks `user: AuthUser | null` (Firestore model) and `firebaseUser: FirebaseUser | null`
  - On mount:
    - Calls `firebaseService.initializeSampleData()` (idempotent sample data seeding)
    - Subscribes to Firebase Auth via `authService.onAuthStateChange`
    - When a Firebase user is present, fetches corresponding `AuthUser` from Firestore (`authUsers` collection) via `authService.getAuthUserData`
  - Exposes `login`, `logout`, and `register` methods used by login/registration screens
- `src/services/authService.ts` wraps Firebase Auth for sign up/sign in/sign out and keeps Firestore `authUsers` in sync.
- Core auth-related types live in `src/types/index.ts` (`AuthUser`, `Member`, etc.).

### Data & Services Layer
There are two data access paths, but **the Firebase-based one is the primary implementation** used by screens and notifications.

#### Firebase-backed services
- `src/config/environment.ts` and `src/config/firebase.ts`:
  - `ENV.FIREBASE` carries config values used to initialize the Firebase app.
  - `getFirebaseConfig()` converts that into the shape expected by `initializeApp`.
  - Exports `auth` and `db` singletons.
- `src/services/firebaseService.ts`:
  - Central Firestore data access layer for domain models:
    - Members (`members` collection)
    - Workouts (`workouts`)
    - Progress logs (`progressLogs`)
    - Fitness plans (`fitnessPlans`)
    - Diet charts (`dietCharts`)
    - Auth users (`authUsers`)
    - Notifications (`notifications`)
  - Provides CRUD and query helpers: `createMember`, `getMember`, `getWorkoutsByMember`, `getFitnessPlanByMember`, `getDietChartByMember`, `getProgressLogsByMember`, etc.
  - Handles Firestore `Timestamp` conversion to/from JS `Date` via `prepareDataForFirestore` / `convertFromFirestore` so UI components deal with JS dates and strings.
  - Includes aggregate/admin helpers: `getAllMembers`, `getAllWorkouts`, `getAllProgressLogs`, `getAllFitnessPlans`, `getAllDietCharts`, `getAllNotifications`, and `getMembersNeedingRenewal`.
  - `initializeSampleData()` seeds sample members, auth users, workouts, and progress logs if the DB is empty.
- `src/services/notificationService.ts`:
  - Wraps Expo Notifications and Device APIs.
  - Abstracts over Expo Go vs standalone builds (push tokens usually unavailable in Expo Go → uses local notifications instead).
  - Encodes gym-specific logic around membership renewal:
    - Calculates days until `membershipEndDate`.
    - Creates Firestore `Notification` documents with type `membership_renewal` for various states (upcoming, urgent, expired).
    - Optionally schedules local notifications (short-delay reminders, daily checks when not in Expo Go).
  - Exposes `checkAllMembersForRenewal()` to scan all members and generate notifications.

#### Local/AsyncStorage-backed service
- `src/services/database.ts`:
  - Provides an alternate storage implementation on top of `AsyncStorage` for `Member`, `Workout`, `FitnessPlan`, `DietChart`, `ProgressLog`, `AuthUser`, and `Notification`.
  - Not used by the main UI at present; treat it as a local/offline or legacy abstraction.
  - If adding new features, **prefer updating the Firebase service first**, and only extend this if you consciously want a local-only mode.

### Screens & UI Structure
- Member-facing screens are in `src/screens/` and use:
  - `useAuth` for identity
  - `firebaseService` for data
  - Reusable components such as `RefreshHeader`, `NotificationBadge`
- Example flows:
  - `DashboardScreen.tsx` (member):
    - Loads `Member`, recent `Workout`s, and `ProgressLog`s for `user.memberId`.
    - Uses `RefreshHeader` for a gradient header with pull-to-refresh integration.
    - Shows quick stats and navigates to `Workouts` and `Progress` tabs.
  - Other member screens (not fully enumerated here) follow similar patterns: query via `firebaseService`, render cards/lists, and navigate using the route names defined in `MemberTabParamList` and `RootStackParamList`.

- Admin-specific screens live under `src/screens/admin/`:
  - `AdminDashboardScreen.tsx`:
    - Aggregates global stats (counts of members, workouts, progress logs, fitness plans, diet charts) via admin helpers from `firebaseService`.
    - Offers quick actions for managing users, workouts, progress, plans, diet charts, and notifications.
    - Displays recent members and links into `AdminEditUser` for editing.
    - Integrates `QRModal` to show a QR code for admin access.
  - Other admin screens handle listing/editing domain entities (users, workouts, progress, plans, diet charts, notifications) and use the same service layer.

### Reusable Components
- `src/components/RefreshHeader.tsx`:
  - Gradient header with optional back and refresh buttons.
  - Used by screens that need a consistent top section plus manual refresh.
- `src/components/NotificationBadge.tsx`:
  - Subscribes to `useAuth` and calls `firebaseService.getNotificationsByUser(user.memberId)`.
  - Renders a dot/badge with unread count (capped at `99+`), used inside the Notifications tab icon.
- `src/components/QRModal.tsx`:
  - Generic modal to display a QR code image and a title.
  - Used on admin dashboard; configurable `qrImageUrl` and `title`.

### Types & Domain Modeling
- All domain types are centralized in `src/types/index.ts`:
  - Core entities: `Member`, `Workout`, `Exercise`, `FitnessPlan`, `WorkoutTemplate`, `DietChart`, `Meal`, `FoodItem`, `ProgressLog`, `BodyMeasurements`, `Trainer`, `AuthUser`, `Admin`, `Notification`, `MembershipRenewalNotification`.
  - Many Firestore documents include:
    - `Date` fields for domain concepts (`startDate`, `endDate`, `date`),
    - ISO string timestamps (`createdAt`, `updatedAt`),
    - IDs that match Firestore document IDs.
- When adding new features, update these types first so services and screens can remain type-safe.

## Repo-Specific Notes for Agents
- This app assumes some Firestore data; `AuthContext` will attempt `initializeSampleData()` on mount. If Firestore security rules block writes, member/admin flows may fail—look at console warnings emitted from `AuthContext` and `firebaseService`.
- Firebase config is currently hardcoded in `src/config/environment.ts`. Before committing changes that touch this file, avoid altering project IDs/app IDs unless intentionally switching environments.
- Navigation route names are string-literal sensitive (e.g. `'Fitness Plan'`, `'Diet Chart'`, `'Admin Dashboard'`). When adding screens or links, use the existing route names/types from `src/types/navigation.ts` to avoid runtime navigation errors.
- If you need to introduce tests or linting, prefer adding npm scripts in `package.json` and documenting them here once they exist.
