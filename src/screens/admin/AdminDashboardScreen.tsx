import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import firebaseService from '../../services/firebaseService';
import { Member, Workout, ProgressLog, FitnessPlan, DietChart } from '../../types';
import { RootStackParamList, AdminTabParamList } from '../../types/navigation';
import QRModal from '../../components/QRModal';

type AdminNavigationProp = StackNavigationProp<RootStackParamList & AdminTabParamList>;

const AdminDashboardScreen = () => {
  const navigation = useNavigation<AdminNavigationProp>();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalWorkouts: 0,
    totalProgressLogs: 0,
    totalFitnessPlans: 0,
    totalDietCharts: 0,
  });
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [clan, setClan] = useState<any>(null);

  const loadData = async () => {
    if (!user?.clanId) return;
    
    try {
      const clanId = user.clanId;
      const [members, workouts, progressLogs, fitnessPlans, dietCharts, clanData] = await Promise.all([
        firebaseService.getMembersByClan(clanId),
        firebaseService.getAllWorkouts(clanId),
        firebaseService.getAllProgressLogs(clanId),
        firebaseService.getAllFitnessPlans(clanId),
        firebaseService.getAllDietCharts(clanId),
        firebaseService.getClan(clanId),
      ]);

      setClan(clanData);

      setStats({
        totalMembers: members.length,
        totalWorkouts: workouts.length,
        totalProgressLogs: progressLogs.length,
        totalFitnessPlans: fitnessPlans.length,
        totalDietCharts: dietCharts.length,
      });

      // Get recent members (last 5)
      const sortedMembers = members
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      setRecentMembers(sortedMembers);
    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
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

  const StatCard = ({ title, value, icon, color, onPress }: {
    title: string;
    value: number | string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <LinearGradient
        colors={[color, `${color}80`]}
        style={styles.statGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon} size={32} color="white" />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const QuickActionCard = ({ title, description, icon, onPress }: {
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <Ionicons name={icon} size={24} color="#007AFF" />
      <View style={styles.quickActionText}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <LinearGradient
          colors={['#FF6B35', '#F7931E']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Admin Dashboard</Text>
              <Text style={styles.headerSubtitle}>
                {clan ? `Manage your gym operations • ${clan.name}` : 'Manage your gym operations'}
              </Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Statistics */}
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Members"
              value={stats.totalMembers}
              icon="people"
              color="#007AFF"
              onPress={() => navigation.navigate('Users')}
            />
            <StatCard
              title="Workouts"
              value={stats.totalWorkouts}
              icon="fitness"
              color="#34C759"
              onPress={() => navigation.navigate('Workouts')}
            />

            <StatCard
              title="Fitness Plans"
              value={stats.totalFitnessPlans}
              icon="flag"
              color="#AF52DE"
              onPress={() => navigation.navigate('Fitness Plans')}
            />
            <StatCard
              title="Diet Charts"
              value={stats.totalDietCharts}
              icon="restaurant"
              color="#FF3B30"
              onPress={() => navigation.navigate('Diet Charts')}
            />
            <StatCard
              title="Invite Code"
              value={clan?.inviteCode || '...'}
              icon="key"
              color="#5856D6"
            />
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickActionCard
              title="Manage Users"
              description="View, edit, and manage member accounts"
              icon="people"
              onPress={() => navigation.navigate('Users')}
            />
            <QuickActionCard
              title="View Workouts"
              description="Monitor all workout activities"
              icon="fitness"
              onPress={() => navigation.navigate('Workouts')}
            />

            <QuickActionCard
              title="Fitness Plans"
              description="Manage fitness plans and templates"
              icon="flag"
              onPress={() => navigation.navigate('Fitness Plans')}
            />
            <QuickActionCard
              title="Diet Charts"
              description="Manage diet charts and meal plans"
              icon="restaurant"
              onPress={() => navigation.navigate('Diet Charts')}
            />
            <QuickActionCard
              title="Invite Code"
              description="Share this code with members to join"
              icon="key"
              onPress={() => Alert.alert("Invite Code", `Your clan invite code is:\n\n${clan?.inviteCode}\n\nShare this code with your members.`)}
            />
            <QuickActionCard
              title="Manage Notifications"
              description="Send renewal reminders and manage notifications"
              icon="notifications"
              onPress={() => navigation.navigate('AdminNotifications')}
            />
          </View>

          {/* Recent Members */}
          <Text style={styles.sectionTitle}>Recent Members</Text>
          <View style={styles.recentMembers}>
            {recentMembers.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={styles.memberCard}
                onPress={() => navigation.navigate('AdminEditUser', { userId: member.id })}
              >
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                  <Text style={styles.memberStatus}>
                    Status: {member.membershipStatus}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            ))}
            {recentMembers.length === 0 && (
              <Text style={styles.noDataText}>No members found</Text>
            )}
          </View>
        </View>
      </ScrollView>

    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1C1C1E',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  statTitle: {
    fontSize: 14,
    color: 'white',
    marginTop: 5,
    textAlign: 'center',
  },
  quickActions: {
    marginBottom: 30,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickActionText: {
    flex: 1,
    marginLeft: 15,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  quickActionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  recentMembers: {
    marginBottom: 30,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  memberEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  memberStatus: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  noDataText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 20,
  },
});

export default AdminDashboardScreen; 