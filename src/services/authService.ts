import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { createAuthUser, getAuthUserByEmail } from './firebaseService';
import { AuthUser } from '../types';

// Admin email constant
export const ADMIN_EMAIL = 'bhvanmadhur@gmail.com';

// Sign up with email and password
export const signUp = async (
  email: string,
  password: string,
  memberData: any
): Promise<FirebaseUser> => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with display name
    await updateProfile(user, {
      displayName: memberData.name
    });

    // Create auth user record in Firestore
    await createAuthUser({
      email: email,
      memberId: memberData.id,
      clanId: memberData.clanId || '',
      role: email === ADMIN_EMAIL ? 'owner' : 'member',
      isActive: true,
      createdAt: new Date().toISOString()
    });

    return user;
  } catch (error: any) {
    console.error('Error signing up:', error);
    throw new Error(error.message);
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Error signing in:', error);
    throw new Error(error.message);
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<{ user: FirebaseUser; isNewUser: boolean }> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if auth user record exists
    const existingAuthUser = await getAuthUserByEmail(user.email!);
    const isNewUser = !existingAuthUser;

    if (isNewUser) {
      // Create a basic auth user record — clan join will happen later
      await createAuthUser({
        email: user.email!,
        role: user.email === ADMIN_EMAIL ? 'owner' : 'member',
        isActive: true,
        createdAt: new Date().toISOString()
      });
    }

    return { user, isNewUser };
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw new Error(error.message);
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error(error.message);
  }
};

// Get current user
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get auth user data from Firestore
export const getAuthUserData = async (email: string): Promise<AuthUser | null> => {
  try {
    return await getAuthUserByEmail(email);
  } catch (error) {
    console.error('Error getting auth user data:', error);
    return null;
  }
};

// Reset password via email
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log(`Password reset email sent to ${email}`);
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    throw new Error(error.message);
  }
};