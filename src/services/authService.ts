import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { createAuthUser, getAuthUserById, createMember } from './firebaseService';
import { AuthUser, Member } from '../types';

// Admin email constant
export const ADMIN_EMAIL = 'bhvanmadhur@gmail.com';

// Sign up with email and password
export const signUp = async (
  email: string,
  password: string,
  memberData: Omit<Member, 'id'>
): Promise<FirebaseUser> => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with display name
    await updateProfile(user, {
      displayName: memberData.name
    });

    // Create member in Firestore now that auth is established
    const newMember = await createMember(memberData);

    // Create auth user record in Firestore
    await createAuthUser(user.uid, {
      email: email,
      memberId: newMember.id,
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

// Sign in with Google using an ID token from expo-auth-session OAuth flow
export const signInWithGoogle = async (idToken: string): Promise<{ user: FirebaseUser; isNewUser: boolean }> => {
  try {
    // Create Firebase credential from the Google ID token
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    // Check if authUsers doc already exists
    let isNewUser = false;
    try {
      const existingAuthUser = await getAuthUserById(user.uid);
      if (!existingAuthUser) {
        isNewUser = true;
        // Create authUser doc for new Google users (no clan yet)
        await createAuthUser(user.uid, {
          email: user.email || '',
          clanId: '',
          role: user.email === ADMIN_EMAIL ? 'owner' : 'member',
          isActive: true,
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      // If getAuthUserById fails (permissions etc.), treat as new user
      isNewUser = true;
      await createAuthUser(user.uid, {
        email: user.email || '',
        clanId: '',
        role: user.email === ADMIN_EMAIL ? 'owner' : 'member',
        isActive: true,
        createdAt: new Date().toISOString(),
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
export const getAuthUserData = async (uid: string): Promise<AuthUser | null> => {
  try {
    return await getAuthUserById(uid);
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