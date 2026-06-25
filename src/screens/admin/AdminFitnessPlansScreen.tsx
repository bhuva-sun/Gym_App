import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, AdminTabParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';

type AdminNavigationProp = StackNavigationProp<RootStackParamList & AdminTabParamList>;
import firebaseService from '../../services/firebaseService';
import { FitnessPlan, Member } from '../../types';

const AdminFitnessPlansScreen = () => {
  const navigation = useNavigation<AdminNavigationProp>();
  const [fitnessPlans, setFitnessPlans] = useState<FitnessPlan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { user } = useAuth();
  
  const loadData = async () => {
    if (!user?.clanId) return;

    try {
      const clanId = user.clanId;
      const [plansData, membersData] = await Promise.all([
        firebaseService.getAllFitnessPlans(clanId),
        firebaseService.getMembersByClan(clanId),
      ]);
      setFitnessPlans(plansData);
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading fitness plans data:', error);
      Alert.alert('Error', 'Failed to load fitness plans data');
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

  const handleDeletePlan = (planId: string, planName: string) => {
    Alert.alert(
      'Delete Fitness Plan',
      `Are you sure you want to delete "${planName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseService.deleteFitnessPlan(planId);
              Alert.alert('Success', 'Fitness plan deleted successfully');
              loadData(); // Reload the data
            } catch (error) {
              console.error('Error deleting fitness plan:', error);
              Alert.alert('Error', 'Failed to delete fitness plan');
            }
          },
        },
      ]
    );
  };

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : 'Unknown Member';
  };

  const filteredPlans = fitnessPlans.filter(plan => {
    const memberName = getMemberName(plan.memberId);
    return (
      memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const renderPlanItem = ({ item }: { item: FitnessPlan }) => {
    const memberName = getMemberName(item.memberId);
    
    return (
      <View style={styles.planCard}>
        <View style={styles.planHeader}>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>{item.name}</Text>
            <Text style={styles.memberName}>{memberName}</Text>
          </View>
          <View style={[styles.statusContainer, { backgroundColor: item.isActive ? '#34C759' : '#FF9500' }]}>
            <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>

        <View style={styles.planDetails}>
          <Text style={styles.descriptionText}>{item.description}</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Goal:</Text>
            <Text style={styles.detailValue}>{item.goal}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>
              {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Workouts:</Text>
            <Text style={styles.detailValue}>{item.workoutTemplates.length} templates</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => navigation.navigate('AdminEditFitnessPlan', { planId: item.id })}
          >
            <Ionicons name="eye" size={20} color="white" />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => navigation.navigate('AdminEditFitnessPlan', { planId: item.id })}
          >
            <Ionicons name="create" size={20} color="white" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeletePlan(item.id, item.name)}
          >
            <Ionicons name="trash" size={20} color="white" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B35', '#F7931E']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Manage Fitness Plans</Text>
        <Text style={styles.headerSubtitle}>{fitnessPlans.length} total plans</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search plans by member, name, or description..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>

        {/* Plans List */}
        <FlatList
          data={filteredPlans}
          renderItem={renderPlanItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="flag-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No fitness plans found matching your search' : 'No fitness plans found'}
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1C1C1E',
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  memberName: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statusContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planDetails: {
    marginBottom: 15,
  },
  descriptionText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 5,
  },
  viewButton: {
    backgroundColor: '#34C759',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default AdminFitnessPlansScreen; 