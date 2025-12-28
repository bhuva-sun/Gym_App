import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Member, Notification } from '../types';
import firebaseService from './firebaseService';

// Configure notification behavior for Expo Go compatibility
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false, // Disabled for Expo Go compatibility
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;
  // Assume non-Expo Go by default; we'll detect actual environment at runtime
  private isExpoGo: boolean = false;

  // Check if running in Expo Go using app ownership
  private checkExpoGoEnvironment() {
    try {
      const ownership = Constants.appOwnership; // 'expo' in Expo Go, 'standalone' or 'guest' in dev/prod builds
      this.isExpoGo = ownership === 'expo';
      console.log(`Notification environment: appOwnership=${ownership}, isExpoGo=${this.isExpoGo}`);
    } catch (error) {
      // If we can't determine, assume non-Expo Go so dev/production builds can get push tokens
      console.log('Could not determine app ownership, assuming non-Expo Go for notifications:', error);
      this.isExpoGo = false;
    }
  }

  // Request notification permissions (Expo Go compatible)
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Notifications');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Check environment
      this.checkExpoGoEnvironment();
      
      // In Expo Go, we skip push token generation
      if (this.isExpoGo) {
        console.log('Expo Go detected - push notifications not available');
        return true; // Return true for local notifications
      }

      // For development builds, try to get push token
      try {
        const token = await Notifications.getExpoPushTokenAsync();
        this.expoPushToken = token.data;
        console.log('Push token obtained:', this.expoPushToken);
        return true;
      } catch (error) {
        console.log('Error getting push token (expected in Expo Go):', error);
        return true; // Still return true for local notifications
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Get the current push token
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  // Check if running in Expo Go
  isRunningInExpoGo(): boolean {
    return this.isExpoGo;
  }

  // Schedule a local notification (Expo Go compatible)
  async scheduleLocalNotification(
    title: string,
    body: string,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: 'local_notification' },
        },
        trigger: trigger || null,
      });
      
      console.log('Local notification scheduled:', identifier);
      return identifier;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }

  // Send membership renewal notification (Expo Go compatible)
  async sendMembershipRenewalNotification(member: Member): Promise<void> {
    try {
      const daysUntilExpiry = this.calculateDaysUntilExpiry(member.membershipEndDate);
      
      if (daysUntilExpiry <= 0) {
        // Membership already expired
        await this.createExpiredMembershipNotification(member);
      } else if (daysUntilExpiry <= 7) {
        // Expires within a week
        await this.createUrgentRenewalNotification(member, daysUntilExpiry);
      } else if (daysUntilExpiry <= 30) {
        // Expires within a month
        await this.createRenewalReminderNotification(member, daysUntilExpiry);
      }
    } catch (error) {
      console.error('Error sending membership renewal notification:', error);
    }
  }

  // Create urgent renewal notification (expires within 7 days)
  private async createUrgentRenewalNotification(member: Member, daysUntilExpiry: number): Promise<void> {
    const notification: Omit<Notification, 'id'> = {
      userId: member.id,
      title: '⚠️ Urgent: Membership Expiring Soon!',
      message: `Your membership expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}. Renew now to avoid interruption in your fitness journey!`,
      type: 'membership_renewal',
      isRead: false,
      createdAt: new Date().toISOString(),
      data: {
        memberId: member.id,
        membershipEndDate: member.membershipEndDate.toISOString(),
        daysUntilExpiry,
        membershipFee: member.membershipFee,
      },
    };

    // Save to Firebase
    await firebaseService.createNotification(notification);
    
    // Schedule local notification (works in Expo Go)
    try {
      await this.scheduleLocalNotification(
        notification.title,
        notification.message,
        { seconds: 2 } // Small delay to ensure it shows
      );
    } catch (error) {
      console.log('Local notification failed (expected in some cases):', error);
    }
  }

  // Create renewal reminder notification (expires within 30 days)
  private async createRenewalReminderNotification(member: Member, daysUntilExpiry: number): Promise<void> {
    const notification: Omit<Notification, 'id'> = {
      userId: member.id,
      title: '📅 Membership Renewal Reminder',
      message: `Your membership will expire on ${member.membershipEndDate.toLocaleDateString()}. Consider renewing to continue your fitness journey!`,
      type: 'membership_renewal',
      isRead: false,
      createdAt: new Date().toISOString(),
      data: {
        memberId: member.id,
        membershipEndDate: member.membershipEndDate.toISOString(),
        daysUntilExpiry,
        membershipFee: member.membershipFee,
      },
    };

    // Save to Firebase (this works in Expo Go)
    await firebaseService.createNotification(notification);
    
    // Note: We don't schedule local notifications for 30-day reminders in Expo Go
    // to avoid notification spam. Users will see them in the app.
  }

  // Create expired membership notification
  private async createExpiredMembershipNotification(member: Member): Promise<void> {
    const notification: Omit<Notification, 'id'> = {
      userId: member.id,
      title: '❌ Membership Expired',
      message: 'Your membership has expired. Please renew to continue accessing gym facilities and services.',
      type: 'membership_renewal',
      isRead: false,
      createdAt: new Date().toISOString(),
      data: {
        memberId: member.id,
        membershipEndDate: member.membershipEndDate.toISOString(),
        daysUntilExpiry: 0,
        membershipFee: member.membershipFee,
      },
    };

    // Save to Firebase
    await firebaseService.createNotification(notification);
    
    // Schedule local notification for expired memberships
    try {
      await this.scheduleLocalNotification(
        notification.title,
        notification.message,
        { seconds: 2 }
      );
    } catch (error) {
      console.log('Local notification failed (expected in some cases):', error);
    }
  }

  // Calculate days until membership expiry
  private calculateDaysUntilExpiry(membershipEndDate: Date): number {
    const today = new Date();
    const endDate = new Date(membershipEndDate);
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  }

  // Check all members for renewal notifications
  async checkAllMembersForRenewal(): Promise<void> {
    try {
      const members = await firebaseService.getAllMembers();
      
      for (const member of members) {
        if (member.membershipStatus === 'active') {
          await this.sendMembershipRenewalNotification(member);
        }
      }
    } catch (error) {
      console.error('Error checking members for renewal:', error);
    }
  }

  // Schedule daily renewal check (Expo Go compatible)
  async scheduleDailyRenewalCheck(): Promise<void> {
    if (this.isExpoGo) {
      console.log('Daily renewal check not available in Expo Go');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Daily Membership Check',
          body: 'Checking for memberships that need renewal...',
          data: { type: 'daily_renewal_check' },
        },
        trigger: {
          hour: 9,
          minute: 0,
          repeats: true,
        },
      });
    } catch (error) {
      console.log('Daily check scheduling failed (expected in Expo Go):', error);
    }
  }

  // Cancel all scheduled notifications
  async cancelAllScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.log('Error canceling notifications:', error);
    }
  }

  // Get notification settings
  async getNotificationSettings(): Promise<Notifications.NotificationPermissionsStatus> {
    try {
      return await Notifications.getPermissionsAsync();
    } catch (error) {
      console.log('Error getting notification settings:', error);
      return { status: 'undetermined', granted: false, expires: 'never' };
    }
  }

  // Add notification listener
  addNotificationListener(callback: (notification: Notifications.Notification) => void): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Add notification response listener (when user taps notification)
  addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Get notification environment info
  getEnvironmentInfo(): { isExpoGo: boolean; pushNotificationsAvailable: boolean } {
    return {
      isExpoGo: this.isExpoGo,
      pushNotificationsAvailable: !this.isExpoGo,
    };
  }
}

export default new NotificationService(); 