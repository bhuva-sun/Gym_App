import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';
import {
  Member,
  Workout,
  Exercise,
  FitnessPlan,
  WorkoutTemplate,
  ExerciseTemplate,
  DietChart,
  Meal,
  FoodItem,
  ProgressLog,
  BodyMeasurements,
  Trainer,
  AuthUser,
  Notification,
  Clan
} from '../types';

// Admin email
const ADMIN_EMAIL = 'bhvanmadhur@gmail.com';

// ========== Helpers ==========

const convertTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
};

const convertToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

const prepareDataForFirestore = (data: any): any => {
  const prepared = { ...data };
  Object.keys(prepared).forEach(key => {
    if (prepared[key] === undefined) {
      delete prepared[key];
    } else if (prepared[key] instanceof Date) {
      prepared[key] = convertToTimestamp(prepared[key]);
    }
  });
  return prepared;
};

const convertFromFirestore = (data: any): any => {
  const converted = { ...data };
  Object.keys(converted).forEach(key => {
    if (converted[key] && typeof converted[key] === 'object' && converted[key].seconds) {
      converted[key] = convertTimestamp(converted[key]);
    }
  });
  return converted;
};

// Generate a 6-char alphanumeric invite code
export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars (0/O, 1/I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ========== Clan Operations ==========

export const createClan = async (clanData: Omit<Clan, 'id'>): Promise<Clan> => {
  try {
    const docRef = await addDoc(collection(db, 'clans'), {
      ...prepareDataForFirestore(clanData),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...clanData };
  } catch (error) {
    console.error('Error creating clan:', error);
    throw error;
  }
};

export const getClan = async (id: string): Promise<Clan | null> => {
  try {
    const docRef = doc(db, 'clans', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...convertFromFirestore(docSnap.data()) } as Clan;
    }
    return null;
  } catch (error) {
    console.error('Error getting clan:', error);
    throw error;
  }
};

export const getClanByInviteCode = async (inviteCode: string): Promise<Clan | null> => {
  try {
    const q = query(
      collection(db, 'clans'),
      where('inviteCode', '==', inviteCode.toUpperCase()),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return { id: docSnap.id, ...convertFromFirestore(docSnap.data()) } as Clan;
    }
    return null;
  } catch (error) {
    console.error('Error getting clan by invite code:', error);
    throw error;
  }
};

export const updateClan = async (id: string, updates: Partial<Clan>): Promise<void> => {
  try {
    const docRef = doc(db, 'clans', id);
    await updateDoc(docRef, {
      ...prepareDataForFirestore(updates),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating clan:', error);
    throw error;
  }
};

export const joinClanViaFunction = async (inviteCode: string): Promise<Clan> => {
  const callable = httpsCallable<{ inviteCode: string }, Clan>(functions, 'joinClan');
  const result = await callable({ inviteCode });
  return result.data;
};

// ========== Member Operations ==========

export const createMember = async (memberData: Omit<Member, 'id'>): Promise<Member> => {
  try {
    const docRef = await addDoc(collection(db, 'members'), {
      ...prepareDataForFirestore(memberData),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...memberData };
  } catch (error) {
    console.error('Error creating member:', error);
    throw error;
  }
};

export const getMember = async (id: string): Promise<Member | null> => {
  try {
    const docRef = doc(db, 'members', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...convertFromFirestore(docSnap.data()) } as Member;
    }
    return null;
  } catch (error) {
    console.error('Error getting member:', error);
    throw error;
  }
};

export const getMemberByEmail = async (email: string): Promise<Member | null> => {
  try {
    const q = query(
      collection(db, 'members'),
      where('email', '==', email),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return { id: docSnap.id, ...convertFromFirestore(docSnap.data()) } as Member;
    }
    return null;
  } catch (error) {
    console.error('Error getting member by email:', error);
    throw error;
  }
};

export const updateMember = async (id: string, updates: Partial<Member>): Promise<void> => {
  try {
    const docRef = doc(db, 'members', id);
    await updateDoc(docRef, {
      ...prepareDataForFirestore(updates),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
};

export const getAllMembers = async (): Promise<Member[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'members'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    })) as Member[];
  } catch (error) {
    console.error('Error getting all members:', error);
    throw error;
  }
};

export const getMembersByClan = async (clanId: string): Promise<Member[]> => {
  try {
    const q = query(collection(db, 'members'), where('clanId', '==', clanId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    })) as Member[];
  } catch (error) {
    console.error('Error getting members by clan:', error);
    throw error;
  }
};

export const deleteMember = async (memberId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'members', memberId));
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
};

// ========== Workout Operations ==========

export const getWorkout = async (id: string): Promise<Workout | null> => {
  try {
    const docRef = doc(db, 'workouts', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...convertFromFirestore(docSnap.data()) } as Workout;
    }
    return null;
  } catch (error) {
    console.error('Error getting workout:', error);
    throw error;
  }
};

export const createWorkout = async (workoutData: Omit<Workout, 'id'>): Promise<Workout> => {
  try {
    const docRef = await addDoc(collection(db, 'workouts'), {
      ...prepareDataForFirestore(workoutData),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...workoutData };
  } catch (error) {
    console.error('Error creating workout:', error);
    throw error;
  }
};

export const getWorkoutsByMember = async (memberId: string): Promise<Workout[]> => {
  try {
    const q = query(
      collection(db, 'workouts'),
      where('memberId', '==', memberId)
    );
    const querySnapshot = await getDocs(q);
    const workouts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    })) as Workout[];
    return workouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error getting workouts by member:', error);
    throw error;
  }
};

export const updateWorkout = async (id: string, updates: Partial<Workout>): Promise<void> => {
  try {
    const docRef = doc(db, 'workouts', id);
    await updateDoc(docRef, {
      ...prepareDataForFirestore(updates),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating workout:', error);
    throw error;
  }
};

export const deleteWorkout = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'workouts', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
};

// ========== Fitness Plan Operations ==========

export const getFitnessPlan = async (id: string): Promise<FitnessPlan | null> => {
  try {
    const docRef = doc(db, 'fitnessPlans', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...convertFromFirestore(docSnap.data()) } as FitnessPlan;
    }
    return null;
  } catch (error) {
    console.error('Error getting fitness plan:', error);
    throw error;
  }
};

export const createFitnessPlan = async (planData: Omit<FitnessPlan, 'id'>): Promise<FitnessPlan> => {
  try {
    const docRef = await addDoc(collection(db, 'fitnessPlans'), {
      ...prepareDataForFirestore(planData),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...planData };
  } catch (error) {
    console.error('Error creating fitness plan:', error);
    throw error;
  }
};

export const getFitnessPlanByMember = async (memberId: string): Promise<FitnessPlan | null> => {
  try {
    const q = query(
      collection(db, 'fitnessPlans'),
      where('memberId', '==', memberId),
      where('isActive', '==', true),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return { id: docSnap.id, ...convertFromFirestore(docSnap.data()) } as FitnessPlan;
    }
    return null;
  } catch (error) {
    console.error('Error getting fitness plan by member:', error);
    throw error;
  }
};

export const updateFitnessPlan = async (id: string, updates: Partial<FitnessPlan>): Promise<void> => {
  try {
    const docRef = doc(db, 'fitnessPlans', id);
    await updateDoc(docRef, {
      ...prepareDataForFirestore(updates),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating fitness plan:', error);
    throw error;
  }
};

export const deleteFitnessPlan = async (planId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'fitnessPlans', planId));
  } catch (error) {
    console.error('Error deleting fitness plan:', error);
    throw error;
  }
};

// ========== Progress Log Operations ==========

export const getProgressLog = async (id: string): Promise<ProgressLog | null> => {
  try {
    const docRef = doc(db, 'progressLogs', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...convertFromFirestore(docSnap.data()) } as ProgressLog;
    }
    return null;
  } catch (error) {
    console.error('Error getting progress log:', error);
    throw error;
  }
};

export const createProgressLog = async (progressData: Omit<ProgressLog, 'id'>): Promise<ProgressLog> => {
  try {
    const docRef = await addDoc(collection(db, 'progressLogs'), {
      ...prepareDataForFirestore(progressData),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...progressData };
  } catch (error) {
    console.error('Error creating progress log:', error);
    throw error;
  }
};

export const getProgressLogsByMember = async (memberId: string): Promise<ProgressLog[]> => {
  try {
    const q = query(
      collection(db, 'progressLogs'),
      where('memberId', '==', memberId)
    );
    const querySnapshot = await getDocs(q);
    const logs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    })) as ProgressLog[];
    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error getting progress logs by member:', error);
    throw error;
  }
};

export const updateProgressLog = async (id: string, updates: Partial<ProgressLog>): Promise<void> => {
  try {
    const docRef = doc(db, 'progressLogs', id);
    await updateDoc(docRef, {
      ...prepareDataForFirestore(updates),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating progress log:', error);
    throw error;
  }
};

export const deleteProgressLog = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'progressLogs', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting progress log:', error);
    throw error;
  }
};

// ========== Diet Chart Operations ==========

export const getDietChart = async (id: string): Promise<DietChart | null> => {
  try {
    const docRef = doc(db, 'dietCharts', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...convertFromFirestore(docSnap.data()) } as DietChart;
    }
    return null;
  } catch (error) {
    console.error('Error getting diet chart:', error);
    throw error;
  }
};

export const createDietChart = async (dietData: Omit<DietChart, 'id'>): Promise<DietChart> => {
  try {
    const docRef = await addDoc(collection(db, 'dietCharts'), {
      ...prepareDataForFirestore(dietData),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...dietData };
  } catch (error) {
    console.error('Error creating diet chart:', error);
    throw error;
  }
};

export const getDietChartByMember = async (memberId: string): Promise<DietChart | null> => {
  try {
    const q = query(
      collection(db, 'dietCharts'),
      where('memberId', '==', memberId),
      where('isActive', '==', true),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return { id: docSnap.id, ...convertFromFirestore(docSnap.data()) } as DietChart;
    }
    return null;
  } catch (error) {
    console.error('Error getting diet chart by member:', error);
    throw error;
  }
};

export const updateDietChart = async (id: string, updates: Partial<DietChart>): Promise<void> => {
  try {
    const docRef = doc(db, 'dietCharts', id);
    await updateDoc(docRef, {
      ...prepareDataForFirestore(updates),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating diet chart:', error);
    throw error;
  }
};

export const deleteDietChart = async (dietId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'dietCharts', dietId));
  } catch (error) {
    console.error('Error deleting diet chart:', error);
    throw error;
  }
};

// ========== Auth User Operations ==========

export const createAuthUser = async (uid: string, authData: Omit<AuthUser, 'id'>): Promise<AuthUser> => {
  try {
    const docRef = doc(db, 'authUsers', uid);
    await setDoc(docRef, {
      ...prepareDataForFirestore(authData),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: uid, ...authData };
  } catch (error) {
    console.error('Error creating auth user:', error);
    throw error;
  }
};

export const getAuthUserById = async (uid: string): Promise<AuthUser | null> => {
  try {
    const docRef = doc(db, 'authUsers', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...convertFromFirestore(docSnap.data()) } as AuthUser;
    }
    return null;
  } catch (error) {
    console.error('Error getting auth user data:', error);
    throw error;
  }
};

export const updateAuthUser = async (id: string, updates: Partial<AuthUser>): Promise<void> => {
  try {
    const docRef = doc(db, 'authUsers', id);
    await updateDoc(docRef, {
      ...prepareDataForFirestore(updates),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating auth user:', error);
    throw error;
  }
};

export const deleteAuthUser = async (userId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'authUsers', userId));
  } catch (error) {
    console.error('Error deleting auth user:', error);
    throw error;
  }
};

// ========== Notification Operations ==========

export const createNotification = async (notificationData: Omit<Notification, 'id'>): Promise<Notification> => {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...prepareDataForFirestore(notificationData),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...notificationData };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getNotificationsByUser = async (userId: string): Promise<Notification[]> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    })) as Notification[];
    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error getting notifications by user:', error);
    throw error;
  }
};

export const getAllNotifications = async (clanId?: string): Promise<Notification[]> => {
  try {
    let q;
    if (clanId) {
      q = query(collection(db, 'notifications'), where('clanId', '==', clanId));
    } else {
      q = collection(db, 'notifications');
    }
    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    })) as Notification[];
    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error getting all notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'notifications', id);
    await updateDoc(docRef, {
      isRead: true,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const deleteNotification = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'notifications', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// ========== Admin/Bulk Query Operations ==========

export const getAllAuthUsers = async (clanId: string): Promise<AuthUser[]> => {
  try {
    const q = query(collection(db, 'authUsers'), where('clanId', '==', clanId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    })) as AuthUser[];
  } catch (error) {
    console.error('Error getting all auth users:', error);
    throw error;
  }
};

export const getAllWorkouts = async (clanId: string): Promise<Workout[]> => {
  try {
    const q = query(collection(db, 'workouts'), where('clanId', '==', clanId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    })) as Workout[];
  } catch (error) {
    console.error('Error getting all workouts:', error);
    throw error;
  }
};

export const getAllProgressLogs = async (clanId: string): Promise<ProgressLog[]> => {
  try {
    const q = query(collection(db, 'progressLogs'), where('clanId', '==', clanId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    })) as ProgressLog[];
  } catch (error) {
    console.error('Error getting all progress logs:', error);
    throw error;
  }
};

export const getAllFitnessPlans = async (clanId: string): Promise<FitnessPlan[]> => {
  try {
    const q = query(collection(db, 'fitnessPlans'), where('clanId', '==', clanId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    })) as FitnessPlan[];
  } catch (error) {
    console.error('Error getting all fitness plans:', error);
    throw error;
  }
};

export const getAllDietCharts = async (clanId: string): Promise<DietChart[]> => {
  try {
    const q = query(collection(db, 'dietCharts'), where('clanId', '==', clanId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    })) as DietChart[];
  } catch (error) {
    console.error('Error getting all diet charts:', error);
    throw error;
  }
};

export const getMembersNeedingRenewal = async (daysThreshold: number = 30, clanId?: string): Promise<Member[]> => {
  try {
    const members = clanId ? await getMembersByClan(clanId) : await getAllMembers();
    const today = new Date();
    const thresholdDate = new Date(today.getTime() + (daysThreshold * 24 * 60 * 60 * 1000));
    return members.filter(member => {
      const endDate = new Date(member.membershipEndDate);
      const isStatusEligible = member.membershipStatus === 'active' || member.membershipStatus === 'expired';
      return isStatusEligible && endDate <= thresholdDate;
    });
  } catch (error) {
    console.error('Error getting members needing renewal:', error);
    throw error;
  }
};

// ========== Initialize Sample Data ==========

export const initializeSampleData = async (): Promise<void> => {
  try {
    // Check if sample data already exists
    const members = await getAllMembers();
    if (members.length > 0) {
      console.log('Sample data already exists, skipping initialization');
      return;
    }

    console.log('Initializing sample data...');

    // Create a default clan
    const defaultClan = await createClan({
      name: 'TheGymEye Fitness',
      ownerId: 'admin',
      ownerEmail: ADMIN_EMAIL,
      inviteCode: generateInviteCode(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create sample members
    const member1 = await createMember({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main St, City, State',
      height: 175,
      weight: 70,
      gender: 'male',
      clanId: defaultClan.id,
      membershipStatus: 'active',
      membershipFee: 600,
      membershipFeeStatus: 'paid',
      membershipStartDate: new Date('2024-01-01'),
      membershipEndDate: new Date('2025-12-31'),
      lastPaymentDate: new Date().toISOString(),
      nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emergencyContact: {
        name: 'Jane Doe',
        phone: '+1234567891',
        relationship: 'Spouse'
      }
    });

    const member2 = await createMember({
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1234567892',
      address: '456 Oak Ave, City, State',
      height: 165,
      weight: 55,
      gender: 'female',
      clanId: defaultClan.id,
      membershipStatus: 'active',
      membershipFee: 600,
      membershipFeeStatus: 'paid',
      membershipStartDate: new Date('2024-01-01'),
      membershipEndDate: new Date('2025-12-31'),
      lastPaymentDate: new Date().toISOString(),
      nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emergencyContact: {
        name: 'John Smith',
        phone: '+1234567893',
        relationship: 'Spouse'
      }
    });

    // Create sample auth users
    await createAuthUser('sample_user_1', {
      email: 'john@example.com',
      memberId: member1.id,
      clanId: defaultClan.id,
      role: 'member',
      isActive: true,
      createdAt: new Date().toISOString()
    });

    await createAuthUser('sample_user_2', {
      email: 'jane@example.com',
      memberId: member2.id,
      clanId: defaultClan.id,
      role: 'member',
      isActive: true,
      createdAt: new Date().toISOString()
    });

    // Create admin/owner user
    await createAuthUser('admin_user_id', {
      email: ADMIN_EMAIL,
      role: 'owner',
      clanId: defaultClan.id,
      isActive: true,
      createdAt: new Date().toISOString()
    });

    // Create sample workouts
    await createWorkout({
      memberId: member1.id,
      clanId: defaultClan.id,
      date: new Date('2024-01-15'),
      duration: 60,
      type: 'strength',
      caloriesBurned: 300,
      notes: 'Great workout today!',
      exercises: [
        {
          id: '1',
          name: 'Bench Press',
          sets: 3,
          reps: 10,
          weight: 80,
          restTime: 90,
          notes: 'Felt strong today'
        },
        {
          id: '2',
          name: 'Squats',
          sets: 3,
          reps: 12,
          weight: 100,
          restTime: 120,
          notes: 'Good form maintained'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Create sample progress logs
    await createProgressLog({
      memberId: member1.id,
      clanId: defaultClan.id,
      date: new Date('2024-01-15'),
      weight: 70,
      bodyFat: 15,
      muscleMass: 55,
      notes: 'Feeling good about progress',
      measurements: {
        chest: 95,
        waist: 80,
        hips: 95,
        biceps: 35,
        thighs: 55,
        calves: 35,
        neck: 40
      },
      createdAt: new Date().toISOString()
    });

    console.log('Sample data initialized successfully');
  } catch (error) {
    console.error('Error initializing sample data:', error);
    throw error;
  }
};

// ========== Default Export ==========

export default {
  // Clan
  createClan,
  getClan,
  getClanByInviteCode,
  updateClan,
  generateInviteCode,
  joinClanViaFunction,
  // Member
  createMember,
  getMember,
  getMemberByEmail,
  updateMember,
  getAllMembers,
  getMembersByClan,
  deleteMember,
  // Workout
  getWorkout,
  createWorkout,
  getWorkoutsByMember,
  updateWorkout,
  deleteWorkout,
  // Fitness Plan
  getFitnessPlan,
  createFitnessPlan,
  getFitnessPlanByMember,
  updateFitnessPlan,
  deleteFitnessPlan,
  // Progress Log
  getProgressLog,
  createProgressLog,
  getProgressLogsByMember,
  updateProgressLog,
  deleteProgressLog,
  // Diet Chart
  getDietChart,
  createDietChart,
  getDietChartByMember,
  updateDietChart,
  deleteDietChart,
  // Auth User
  createAuthUser,
  getAuthUserById,
  updateAuthUser,
  deleteAuthUser,
  // Notifications
  createNotification,
  getNotificationsByUser,
  getAllNotifications,
  markNotificationAsRead,
  deleteNotification,
  // Admin
  getAllAuthUsers,
  getAllWorkouts,
  getAllProgressLogs,
  getAllFitnessPlans,
  getAllDietCharts,
  getMembersNeedingRenewal,
  // Init
  initializeSampleData,
};