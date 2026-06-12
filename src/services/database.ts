import AsyncStorage from '@react-native-async-storage/async-storage';
import { Member, Workout, FitnessPlan, DietChart, ProgressLog, Trainer, AuthUser, Notification } from '../types';

class DatabaseService {
  private async getItem<T>(key: string): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error getting item:', error);
      return null;
    }
  }

  private async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting item:', error);
    }
  }

  private async getArray<T>(key: string): Promise<T[]> {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.error('Error getting array:', error);
      return [];
    }
  }

  private async setArray<T>(key: string, value: T[]): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting array:', error);
    }
  }

  // Member operations
  async createMember(member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<Member> {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newMember: Member = { ...member, id, createdAt: now, updatedAt: now };
    
    const members = await this.getArray<Member>('members');
    members.push(newMember);
    await this.setArray('members', members);
    
    return newMember;
  }

  async getMember(id: string): Promise<Member | null> {
    const members = await this.getArray<Member>('members');
    return members.find(member => member.id === id) || null;
  }

  async updateMember(id: string, updates: Partial<Member>): Promise<void> {
    const members = await this.getArray<Member>('members');
    const index = members.findIndex(member => member.id === id);
    
    if (index !== -1) {
      members[index] = { ...members[index], ...updates, updatedAt: new Date().toISOString() };
      await this.setArray('members', members);
    }
  }

  async getAllMembers(): Promise<Member[]> {
    return await this.getArray<Member>('members');
  }

  // Workout operations
  async createWorkout(workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workout> {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newWorkout: Workout = { ...workout, id, createdAt: now, updatedAt: now };
    
    const workouts = await this.getArray<Workout>('workouts');
    workouts.push(newWorkout);
    await this.setArray('workouts', workouts);
    
    return newWorkout;
  }

  async getWorkoutsByMember(memberId: string): Promise<Workout[]> {
    const workouts = await this.getArray<Workout>('workouts');
    return workouts.filter(workout => workout.memberId === memberId);
  }

  // Fitness Plan operations
  async createFitnessPlan(plan: Omit<FitnessPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<FitnessPlan> {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newPlan: FitnessPlan = { ...plan, id, createdAt: now, updatedAt: now };
    
    const plans = await this.getArray<FitnessPlan>('fitness_plans');
    plans.push(newPlan);
    await this.setArray('fitness_plans', plans);
    
    return newPlan;
  }

  async getFitnessPlanByMember(memberId: string): Promise<FitnessPlan | null> {
    const plans = await this.getArray<FitnessPlan>('fitness_plans');
    return plans.find(plan => plan.memberId === memberId && plan.isActive) || null;
  }

  // Progress Log operations
  async createProgressLog(log: Omit<ProgressLog, 'id' | 'createdAt'>): Promise<ProgressLog> {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newLog: ProgressLog = { ...log, id, createdAt: now };
    
    const logs = await this.getArray<ProgressLog>('progress_logs');
    logs.push(newLog);
    await this.setArray('progress_logs', logs);
    
    return newLog;
  }

  async getProgressLogsByMember(memberId: string): Promise<ProgressLog[]> {
    const logs = await this.getArray<ProgressLog>('progress_logs');
    return logs.filter(log => log.memberId === memberId);
  }

  // Diet Chart operations
  async createDietChart(chart: Omit<DietChart, 'id' | 'createdAt' | 'updatedAt'>): Promise<DietChart> {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newChart: DietChart = { ...chart, id, createdAt: now, updatedAt: now };
    
    const charts = await this.getArray<DietChart>('diet_charts');
    charts.push(newChart);
    await this.setArray('diet_charts', charts);
    
    return newChart;
  }

  async getDietChartByMember(memberId: string): Promise<DietChart | null> {
    const charts = await this.getArray<DietChart>('diet_charts');
    return charts.find(chart => chart.memberId === memberId && chart.isActive) || null;
  }

  // Auth operations
  async createAuthUser(user: Omit<AuthUser, 'id' | 'createdAt'> & { password: string }): Promise<AuthUser> {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newUser: AuthUser = { 
      id, 
      email: user.email, 
      role: user.role, 
      memberId: user.memberId, 
      trainerId: user.trainerId, 
      isActive: true,
      createdAt: now 
    };
    
    const users = await this.getArray<AuthUser>('auth_users');
    users.push(newUser);
    await this.setArray('auth_users', users);
    
    // Store password separately for security
    await this.setItem(`password_${id}`, user.password);
    
    return newUser;
  }

  async authenticateUser(email: string, password: string): Promise<AuthUser | null> {
    const users = await this.getArray<AuthUser>('auth_users');
    const user = users.find(u => u.email === email);
    
    if (user) {
      const storedPassword = await this.getItem<string>(`password_${user.id}`);
      if (storedPassword === password) {
        return user;
      }
    }
    
    return null;
  }

  // Notification operations
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newNotification: Notification = { ...notification, id, createdAt: now };
    
    const notifications = await this.getArray<Notification>('notifications');
    notifications.push(newNotification);
    await this.setArray('notifications', notifications);
    
    return newNotification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    const notifications = await this.getArray<Notification>('notifications');
    return notifications.filter(notification => notification.userId === userId);
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const notifications = await this.getArray<Notification>('notifications');
    const index = notifications.findIndex(notification => notification.id === id);
    
    if (index !== -1) {
      notifications[index].isRead = true;
      await this.setArray('notifications', notifications);
    }
  }

  // Initialize with sample data
  async initializeSampleData(): Promise<void> {
    const members = await this.getArray<Member>('members');
    if (members.length === 0) {
      const sampleMember: Member = {
        id: '1',
        clanId: 'default-clan',
        name: 'John Doe',
        gender: 'male',
        height: 175,
        weight: 70,
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St, City',
        membershipStatus: 'active',
        membershipFee: 600,
        membershipFeeStatus: 'paid',
        membershipStartDate: new Date('2024-01-01'),
        membershipEndDate: new Date('2024-12-31'),
        lastPaymentDate: new Date().toISOString(),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await this.setArray('members', [sampleMember]);
      
      // Create auth user for sample member
      await this.createAuthUser({
        email: 'john@example.com',
        password: 'password123',
        role: 'member',
        memberId: '1',
        isActive: true,
      });
    }
  }
}

export const databaseService = new DatabaseService(); 