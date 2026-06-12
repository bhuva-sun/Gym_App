import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFirebaseConfig } from './environment';

const firebaseConfig = getFirebaseConfig();

const formattedConfig = {
  apiKey: firebaseConfig.API_KEY,
  authDomain: firebaseConfig.AUTH_DOMAIN,
  projectId: firebaseConfig.PROJECT_ID,
  storageBucket: firebaseConfig.STORAGE_BUCKET,
  messagingSenderId: firebaseConfig.MESSAGING_SENDER_ID,
  appId: firebaseConfig.APP_ID,
  // Add optional configurations only if they have values
  ...(firebaseConfig.MEASUREMENT_ID && { measurementId: firebaseConfig.MEASUREMENT_ID }),
  ...(firebaseConfig.DATABASE_URL && { databaseURL: firebaseConfig.DATABASE_URL }),
};

const app = initializeApp(formattedConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;