import Constants from "expo-constants";

const firebaseConfig = Constants.expoConfig?.extra?.firebase ?? {};
const googleWebClientId = Constants.expoConfig?.extra?.googleWebClientId ?? "";

export const ENV = {
  FIREBASE: {
    API_KEY: firebaseConfig.apiKey ?? "",
    AUTH_DOMAIN: firebaseConfig.authDomain ?? "",
    PROJECT_ID: firebaseConfig.projectId ?? "",
    STORAGE_BUCKET: firebaseConfig.storageBucket ?? "",
    MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId ?? "",
    APP_ID: firebaseConfig.appId ?? "",
    MEASUREMENT_ID: firebaseConfig.measurementId ?? "",
    DATABASE_URL: firebaseConfig.databaseUrl ?? "",
  },

  APP: {
    NAME: "TheGymEye",
    VERSION: "1.0.0",
    DESCRIPTION: "Your Fitness Journey Starts Here",
  },

  FEATURES: {
    ENABLE_ANALYTICS: false,
    ENABLE_CRASH_REPORTING: false,
    ENABLE_PUSH_NOTIFICATIONS: true,
    ENABLE_OFFLINE_SUPPORT: true,
  },

  API: {
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
  },

  NOTIFICATIONS: {
    ENABLE_MEMBERSHIP_RENEWAL: true,
    RENEWAL_REMINDER_DAYS: 30,
    URGENT_REMINDER_DAYS: 7,
    DAILY_CHECK_TIME: "09:00",
  },

  GOOGLE: {
    WEB_CLIENT_ID: googleWebClientId,
  },
};

export const getFirebaseConfig = () => {
  return ENV.FIREBASE;
};

export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;

export const LOGGING = {
  ENABLED: isDevelopment,
  LEVEL: isDevelopment ? "debug" : "error",
};