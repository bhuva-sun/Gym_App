import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import firebaseService from '../services/firebaseService';
import { Member, Workout, ProgressLog } from '../types';
import { COLORS, GRADIENTS, RADIUS, SHADOWS, TYPOGRAPHY, SPACING } from '../config/theme';

const DashboardScreen = ({ navigation }: any) => {
  const { user, clan, logout } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [recentProgress, setRecentProgress] = useState<ProgressLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!user?.memberId) {
      setIsLoading(false);
      return;
    }

    try {
      const memberData = await firebaseService.getMember(user.memberId);
      const workouts = await firebaseService.getWorkoutsByMember(user.memberId);
      const progressLogs = await firebaseService.getProgressLogsByMember(user.memberId);

      setMember(memberData);
      setRecentWorkouts(workouts.slice(0, 3));
      setRecentProgress(progressLogs.slice(0, 3));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to logout?');
      if (confirmLogout) {
        logout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', onPress: logout, style: 'destructive' },
        ]
      );
    }
  };

  const getMembershipStatusColor = (status: string) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'expired': return COLORS.danger;
      case 'pending': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const calculateBMI = () => {
    if (!member) return 0;
    const heightInMeters = member.height / 100;
    return (member.weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: COLORS.info };
    if (bmi < 25) return { label: 'Normal', color: COLORS.success };
    if (bmi < 30) return { label: 'Overweight', color: COLORS.warning };
    return { label: 'Obese', color: COLORS.danger };
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="fitness" size={48} color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  const bmiStr = calculateBMI();
  const bmi = parseFloat(bmiStr || '0');
  const bmiInfo = getBMICategory(bmi);

  return (
    <View style={styles.container}>
      <ScrollView
        style={[styles.scrollView, Platform.OS === 'web' && { overflow: 'auto' as any }]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={Platform.OS !== 'web'}
      >
        {/* Header */}
        <LinearGradient colors={GRADIENTS.dashboard} style={styles.headerGradient}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <View style={styles.headerActions}>
              <Pressable
                style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
                onPress={onRefresh}
              >
                <Ionicons name="refresh" size={20} color={COLORS.textWhite} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color={COLORS.textWhite} />
              </Pressable>
            </View>
          </View>

          {/* Motivational Banner */}
          <View style={styles.motivationalCard}>
            <Text style={styles.greetingText}>
              {getGreeting()}, {member?.name?.split(' ')[0] || 'Champion'}! 💪
            </Text>
            <Text style={styles.motivationalText}>Ready to crush your goals today?</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* User Profile Card */}
          <Pressable
            style={({ pressed }) => [styles.profileCard, pressed && styles.cardPressed]}
            onPress={() => setShowProfile(!showProfile)}
          >
            <View style={styles.profileRow}>
              <View style={styles.avatarContainer}>
                <LinearGradient colors={GRADIENTS.profile} style={styles.avatar}>
                  <Ionicons name="person" size={28} color={COLORS.textWhite} />
                </LinearGradient>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{member?.name || user?.email}</Text>
                <Text style={styles.profileEmail}>{member?.email || user?.email}</Text>
                {member && (
                  <View style={[styles.statusBadge, { backgroundColor: getMembershipStatusColor(member.membershipStatus) + '15' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getMembershipStatusColor(member.membershipStatus) }]} />
                    <Text style={[styles.statusText, { color: getMembershipStatusColor(member.membershipStatus) }]}>
                      {member.membershipStatus.charAt(0).toUpperCase() + member.membershipStatus.slice(1)}
                    </Text>
                  </View>
                )}
              </View>
              <Pressable
                style={({ pressed }) => [styles.editProfileBtn, pressed && styles.pressed]}
                onPress={() => setShowProfile(!showProfile)}
              >
                <Ionicons name={showProfile ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.primary} />
              </Pressable>
            </View>
          </Pressable>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: COLORS.primaryLight + '20' }]}>
                <Ionicons name="fitness" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.statValue}>{recentWorkouts.length}</Text>
              <Text style={styles.statLabel}>Workouts{'\n'}This Week</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="trending-up" size={20} color={COLORS.success} />
              </View>
              <Text style={styles.statValue}>{recentProgress.length}</Text>
              <Text style={styles.statLabel}>Progress{'\n'}Logs</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: COLORS.warning + '20' }]}>
                <Ionicons name="calendar" size={20} color={COLORS.warning} />
              </View>
              <Text style={styles.statValue}>
                {member ? formatDate(member.membershipEndDate).split(',')[0] : '—'}
              </Text>
              <Text style={styles.statLabel}>Plan{'\n'}Expires</Text>
            </View>
          </View>

          {/* Expandable Profile Section */}
          {showProfile && member && (
            <View style={styles.expandedProfile}>
              {/* Personal Info */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <InfoRow icon="person" label="Name" value={member.name} />
                <InfoRow icon="mail" label="Email" value={member.email} />
                <InfoRow icon="call" label="Phone" value={member.phone} />
                <InfoRow icon="location" label="Address" value={member.address} />
                <InfoRow icon="body" label="Gender" value={member.gender.charAt(0).toUpperCase() + member.gender.slice(1)} isLast />
              </View>

              {/* Physical Stats */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Physical Stats</Text>
                <View style={styles.physicalStatsGrid}>
                  <PhysicalStat icon="resize" label="Height" value={`${member.height} cm`} color={COLORS.info} />
                  <PhysicalStat icon="scale" label="Weight" value={`${member.weight} kg`} color={COLORS.warning} />
                  <PhysicalStat icon="analytics" label="BMI" value={`${bmi}`} color={bmiInfo.color} subtitle={bmiInfo.label} />
                  {recentProgress[0]?.bodyFat && (
                    <PhysicalStat icon="water" label="Body Fat" value={`${recentProgress[0].bodyFat}%`} color={COLORS.danger} />
                  )}
                </View>
              </View>

              {/* Membership Details */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Membership Details</Text>
                <InfoRow icon="card" label="Status" value={member.membershipStatus.toUpperCase()} valueColor={getMembershipStatusColor(member.membershipStatus)} />
                <InfoRow icon="cash" label="Fee" value={`₹${member.membershipFee}/month`} />
                <InfoRow icon="calendar" label="Start" value={formatDate(member.membershipStartDate)} />
                <InfoRow icon="calendar-outline" label="Expires" value={formatDate(member.membershipEndDate)} />
                <InfoRow icon="time" label="Next Payment" value={formatDate(member.nextPaymentDate)} isLast />
              </View>

              {/* Clan Info */}
              {clan && (
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Clan</Text>
                  <InfoRow icon="people" label="Name" value={clan.name} />
                  <InfoRow icon="key" label="Invite Code" value={clan.inviteCode} isLast />
                </View>
              )}

              {/* Emergency Contact */}
              {member.emergencyContact?.name && (
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Emergency Contact</Text>
                  <InfoRow icon="person" label="Name" value={member.emergencyContact.name} color={COLORS.danger} />
                  <InfoRow icon="call" label="Phone" value={member.emergencyContact.phone} color={COLORS.danger} />
                  <InfoRow icon="people" label="Relation" value={member.emergencyContact.relationship} color={COLORS.danger} isLast />
                </View>
              )}
            </View>
          )}

          {/* Recent Workouts */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Workouts</Text>
              <Pressable
                style={({ pressed }) => pressed && styles.pressed}
                onPress={() => navigation.navigate('Workouts')}
              >
                <Text style={styles.seeAllText}>See All</Text>
              </Pressable>
            </View>
            {recentWorkouts.length > 0 ? (
              recentWorkouts.map((workout) => (
                <View key={workout.id} style={styles.workoutItem}>
                  <View style={[styles.workoutTypeIcon, { backgroundColor: getWorkoutColor(workout.type) + '15' }]}>
                    <Ionicons name={getWorkoutIcon(workout.type)} size={18} color={getWorkoutColor(workout.type)} />
                  </View>
                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutName}>{workout.type.charAt(0).toUpperCase() + workout.type.slice(1)} Workout</Text>
                    <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
                  </View>
                  <View style={styles.workoutMeta}>
                    <Text style={styles.workoutDuration}>{workout.duration} min</Text>
                    <Text style={styles.workoutCalories}>{workout.caloriesBurned || 0} cal</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptySection}>
                <Ionicons name="fitness-outline" size={40} color={COLORS.borderLight} />
                <Text style={styles.emptyText}>No recent workouts</Text>
                <Text style={styles.emptySubtext}>Start your first workout to track progress!</Text>
              </View>
            )}
          </View>

          {/* Recent Progress */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Progress</Text>
            </View>
            {recentProgress.length > 0 ? (
              recentProgress.map((progress) => (
                <View key={progress.id} style={styles.progressItem}>
                  <View style={[styles.workoutTypeIcon, { backgroundColor: COLORS.success + '15' }]}>
                    <Ionicons name="trending-up" size={18} color={COLORS.success} />
                  </View>
                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutName}>Weight Progress</Text>
                    <Text style={styles.workoutDate}>{formatDate(progress.date)}</Text>
                  </View>
                  <Text style={styles.progressWeight}>{progress.weight} kg</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptySection}>
                <Ionicons name="bar-chart-outline" size={40} color={COLORS.borderLight} />
                <Text style={styles.emptyText}>No progress logs yet</Text>
                <Text style={styles.emptySubtext}>Keep logging to see your journey!</Text>
              </View>
            )}
          </View>

          {/* Logout Button */}
          <Pressable
            style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutPressed]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

// Helper components
const InfoRow = ({ icon, label, value, color, valueColor, isLast }: {
  icon: any; label: string; value: string; color?: string; valueColor?: string; isLast?: boolean;
}) => (
  <View style={[infoStyles.row, !isLast && infoStyles.bordered]}>
    <Ionicons name={icon} size={18} color={color || COLORS.primary} />
    <Text style={infoStyles.label}>{label}</Text>
    <Text style={[infoStyles.value, valueColor ? { color: valueColor, fontWeight: '600' } : {}]}>{value}</Text>
  </View>
);

const PhysicalStat = ({ icon, label, value, color, subtitle }: {
  icon: any; label: string; value: string; color: string; subtitle?: string;
}) => (
  <View style={physStyles.stat}>
    <Ionicons name={icon} size={22} color={color} />
    <Text style={physStyles.value}>{value}</Text>
    <Text style={physStyles.label}>{label}</Text>
    {subtitle && <Text style={[physStyles.subtitle, { color }]}>{subtitle}</Text>}
  </View>
);

const getWorkoutIcon = (type: string): any => {
  switch (type) {
    case 'cardio': return 'heart';
    case 'strength': return 'fitness';
    case 'flexibility': return 'body';
    case 'mixed': return 'grid';
    default: return 'fitness';
  }
};

const getWorkoutColor = (type: string) => {
  switch (type) {
    case 'cardio': return COLORS.danger;
    case 'strength': return COLORS.info;
    case 'flexibility': return COLORS.success;
    case 'mixed': return COLORS.warning;
    default: return COLORS.textSecondary;
  }
};

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    width: 80,
  },
  value: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
});

const physStyles = StyleSheet.create({
  stat: {
    alignItems: 'center',
    width: '48%',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    marginBottom: 10,
  },
  value: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: 16,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textWhite,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  motivationalCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.lg,
    padding: 18,
  },
  greetingText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textWhite,
    marginBottom: 4,
  },
  motivationalText: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255,255,255,0.85)',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    ...SHADOWS.small,
    marginBottom: 16,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  cardPressed: {
    opacity: 0.95,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    fontSize: 17,
  },
  profileEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginTop: 6,
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  editProfileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    fontSize: 18,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  expandedProfile: {
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 18,
    ...SHADOWS.small,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    fontSize: 16,
    marginBottom: 4,
  },
  seeAllText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: '600',
  },
  physicalStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  workoutTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
  },
  workoutDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  workoutMeta: {
    alignItems: 'flex-end',
  },
  workoutDuration: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.success,
    fontWeight: '600',
  },
  workoutCalories: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
    marginTop: 2,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  progressWeight: {
    ...TYPOGRAPHY.h4,
    color: COLORS.success,
    fontSize: 16,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptySubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.md,
    marginTop: 8,
    marginBottom: 20,
    gap: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  logoutPressed: {
    opacity: 0.8,
  },
  logoutText: {
    ...TYPOGRAPHY.button,
    color: COLORS.danger,
  },
  pressed: {
    opacity: 0.7,
  },
});

export default DashboardScreen;