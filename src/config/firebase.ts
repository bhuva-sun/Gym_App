import { initializeApp } from "firebase/app";
// @ts-ignore
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getFirebaseConfig } from "./environment";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = getFirebaseConfig();

const formattedConfig = {
  apiKey: firebaseConfig.API_KEY,
  authDomain: firebaseConfig.AUTH_DOMAIN,
  projectId: firebaseConfig.PROJECT_ID,
  storageBucket: firebaseConfig.STORAGE_BUCKET,
  messagingSenderId: firebaseConfig.MESSAGING_SENDER_ID,
  appId: firebaseConfig.APP_ID,
  ...(firebaseConfig.MEASUREMENT_ID && {
    measurementId: firebaseConfig.MEASUREMENT_ID,
  }),
  ...(firebaseConfig.DATABASE_URL && {
    databaseURL: firebaseConfig.DATABASE_URL,
  }),
};

import { Platform } from 'react-native';

const app = initializeApp(formattedConfig);

let auth: any;

if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  // @ts-ignore
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
}

export { auth };
export const db = getFirestore(app);
export const functions = getFunctions(app);

export default app;