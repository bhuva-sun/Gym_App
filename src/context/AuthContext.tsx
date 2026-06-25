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
  loginWithGoogle: (idToken: string) => Promise<{ isNewUser: boolean }>;
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
    // Listen to Firebase auth state changes
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Get auth user data from Firestore
          const authUserData = await authService.getAuthUserData(firebaseUser.uid);
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
          } else {
            // No authUser doc in Firestore — set a minimal user so the
            // navigator shows the JoinClan screen instead of Login.
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'member',
              clanId: '',
              isActive: true,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.warn('Error getting auth user data, creating minimal user:', error);
          // Even on error, set a minimal user so the app doesn't loop on Login
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: 'member',
            clanId: '',
            isActive: true,
            createdAt: new Date().toISOString(),
          });
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
    if (firebaseUser?.uid) {
      const authUserData = await authService.getAuthUserData(firebaseUser.uid);
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

  const loginWithGoogle = async (idToken: string): Promise<{ isNewUser: boolean }> => {
    try {
      const { isNewUser } = await authService.signInWithGoogle(idToken);
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
      // Create Firebase auth user, auth user record, and member in Firestore
      await authService.signUp(email, password, memberData);
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

      // Create or update the user's authUser record with clanId and owner role.
      // Use createAuthUser (setDoc) to handle the case where the document
      // doesn't exist yet (e.g. user registered but doc wasn't created).
      await firebaseService.createAuthUser(firebaseUser.uid, {
        email: firebaseUser.email,
        clanId: newClan.id,
        role: 'owner',
        isActive: true,
        createdAt: user?.createdAt || new Date().toISOString(),
      });

      setClan(newClan);
      await refreshUser();
      return newClan;
    } catch (error: any) {
      console.error('Error creating clan:', error);
      throw error;
    }
  };

  const joinClan = async (inviteCode: string): Promise<Clan> => {
    if (!firebaseUser?.uid) throw new Error('Must be logged in to join a clan');
    try {
      const clanData = await firebaseService.getClanByInviteCode(inviteCode);
      if (!clanData) {
        throw new Error('Invalid invite code. No clan found.');
      }

      if (user?.clanId) {
        throw new Error('You are already a member of a clan.');
      }

      // Check if the user document is the dummy fallback or a real one
      const existingUser = await firebaseService.getAuthUserById(firebaseUser.uid);

      // Ensure the user has a Member document.
      // Google sign-in users skip Registration and won't have one.
      let memberId = existingUser?.memberId || user?.memberId;

      if (memberId) {
        // Member doc exists — update its clanId
        try {
          await firebaseService.updateMember(memberId, {
            clanId: clanData.id,
          });
        } catch (e) {
          console.warn('Could not update member document clanId directly. Rules may block this.', e);
        }
      } else {
        // No Member doc — create one from the Firebase profile
        const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Member';
        const now = new Date();
        const newMember = await firebaseService.createMember({
          name: displayName,
          gender: 'other',
          height: 0,
          weight: 0,
          email: firebaseUser.email || '',
          phone: '',
          address: '',
          clanId: clanData.id,
          membershipStatus: 'active',
          membershipFee: 0,
          membershipFeeStatus: 'pending',
          membershipStartDate: now,
          membershipEndDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
          lastPaymentDate: now.toISOString(),
          nextPaymentDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          emergencyContact: { name: '', phone: '', relationship: '' },
        });
        memberId = newMember.id;
      }

      // Update (or create) the authUser doc with the clanId, role, and memberId
      if (existingUser) {
        await firebaseService.updateAuthUser(firebaseUser.uid, {
          clanId: clanData.id,
          role: 'member',
          memberId: memberId,
        });
      } else {
        await firebaseService.createAuthUser(firebaseUser.uid, {
          email: firebaseUser.email || '',
          clanId: clanData.id,
          role: 'member',
          memberId: memberId,
          isActive: true,
          createdAt: user?.createdAt || new Date().toISOString(),
        });
      }

      setClan(clanData);
      await refreshUser();
      return clanData;
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