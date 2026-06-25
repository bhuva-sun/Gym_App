require("dotenv").config();

module.exports = {
  expo: {
    name: "TheGymEye",
    slug: "gymapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      package: "com.thadityasorganization.gymapp",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-notifications", "expo-font", "expo-web-browser"],
    scheme: "thegymeye",
    extra: {
      eas: {
        projectId: "7d6ffd45-eee6-48cd-9ba7-c6f58ea06198",
      },
      firebase: {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID,
        databaseUrl: process.env.FIREBASE_DATABASE_URL,
      },
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID || "",
    },
    owner: "thadityas-organization",
  },
};
