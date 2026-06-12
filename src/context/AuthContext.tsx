import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { AuthUser, Member, Clan } from '../types';
import * as authService from '../services/authService';
import * as firebaseService from '../services/firebaseService';

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  clan: Clan | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<{ isNewUser: boolean }>;
  logout: () => void;
  register: (email: string, password: string, memberData: Omit<Member, 'id'>) => Promise<boolean>;
  createClan: (name: string) => Promise<Clan>;
  joinClan: (inviteCode: string) => Promise<Clan>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [clan, setClan] = useState<Clan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize sample data with error handling
    const initializeApp = async () => {
      try {
        await firebaseService.initializeSampleData();
        console.log('Sample data initialized successfully');
      } catch (error: any) {
        console.warn('Firebase permission error - please update Firestore rules:', error.message);
        // Continue without sample data for now
      }
    };

    initializeApp();

    // Listen to Firebase auth state changes
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Get auth user data from Firestore
          const authUserData = await authService.getAuthUserData(firebaseUser.email!);
          if (authUserData) {
            setUser(authUserData);
            // Load clan data if user has a clanId
            if (authUserData.clanId) {
              try {
                const clanData = await firebaseService.getClan(authUserData.clanId);
                setClan(clanData);
              } catch (e) {
                console.warn('Error loading clan:', e);
              }
            }
          }
        } catch (error) {
          console.warn('Error getting auth user data:', error);
        }
      } else {
        setUser(null);
        setClan(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (firebaseUser?.email) {
      const authUserData = await authService.getAuthUserData(firebaseUser.email);
      if (authUserData) {
        setUser(authUserData);
        if (authUserData.clanId) {
          const clanData = await firebaseService.getClan(authUserData.clanId);
          setClan(clanData);
        }
      }
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await authService.signIn(email, password);
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async (): Promise<{ isNewUser: boolean }> => {
    try {
      const { isNewUser } = await authService.signInWithGoogle();
      return { isNewUser };
    } catch (error: any) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.signOutUser();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const register = async (email: string, password: string, memberData: Omit<Member, 'id'>): Promise<boolean> => {
    try {
      // Create member in Firestore first
      const newMember = await firebaseService.createMember(memberData);

      // Create Firebase auth user and auth user record
      await authService.signUp(email, password, newMember);
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const createClan = async (name: string): Promise<Clan> => {
    if (!firebaseUser?.email) throw new Error('Must be logged in to create a clan');
    
    try {
      const newClan = await firebaseService.createClan({
        name,
        ownerId: firebaseUser.uid,
        ownerEmail: firebaseUser.email,
        inviteCode: firebaseService.generateInviteCode(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update the user's authUser record with clanId and owner role
      if (user?.id) {
        await firebaseService.updateAuthUser(user.id, { clanId: newClan.id, role: 'owner' });
      }

      setClan(newClan);
      await refreshUser();
      return newClan;
    } catch (error: any) {
      console.error('Error creating clan:', error);
      throw error;
    }
  };

  const joinClan = async (inviteCode: string): Promise<Clan> => {
    try {
      const foundClan = await firebaseService.getClanByInviteCode(inviteCode);
      if (!foundClan) throw new Error('Invalid invite code');

      // Update the user's authUser record with clanId
      if (user?.id) {
        await firebaseService.updateAuthUser(user.id, { clanId: foundClan.id });
      }

      setClan(foundClan);
      await refreshUser();
      return foundClan;
    } catch (error: any) {
      console.error('Error joining clan:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    clan,
    isLoading,
    login,
    loginWithGoogle,
    logout,
    register,
    createClan,
    joinClan,
    refreshUser,
  };

  if (typeof window !== 'undefined') {
    (window as any).authLogout = logout;
    (window as any).resetPassword = (email: string) => authService.resetPassword(email);
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};