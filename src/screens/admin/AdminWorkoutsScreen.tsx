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
import firebaseService from '../../services/firebaseService';
import { Workout, Member } from '../../types';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';

type AdminNavigationProp = StackNavigationProp<RootStackParamList>;

const AdminWorkoutsScreen = () => {
  const navigation = useNavigation<AdminNavigationProp>();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { user } = useAuth();
  
  const loadData = async () => {
    if (!user?.clanId) return;

    try {
      const clanId = user.clanId;
      const [workoutsData, membersData] = await Promise.all([
        firebaseService.getAllWorkouts(clanId),
        firebaseService.getMembersByClan(clanId),
      ]);
      setWorkouts(workoutsData);
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading workouts data:', error);
      Alert.alert('Error', 'Failed to load workouts data');
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

  const handleDeleteWorkout = (workoutId: string, workoutDate: Date) => {
    Alert.alert(
      'Delete Workout',
      `Are you sure you want to delete the workout from ${workoutDate.toLocaleDateString()}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseService.deleteWorkout(workoutId);
              Alert.alert('Success', 'Workout deleted successfully');
              loadData(); // Reload the data
            } catch (error) {
              console.error('Error deleting workout:', error);
              Alert.alert('Error', 'Failed to delete workout');
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

  const filteredWorkouts = workouts.filter(workout => {
    const memberName = getMemberName(workout.memberId);
    return (
      memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workout.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workout.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const renderWorkoutItem = ({ item }: { item: Workout }) => {
    const memberName = getMemberName(item.memberId);
    
    return (
      <View style={styles.workoutCard}>
        <View style={styles.workoutHeader}>
          <View style={styles.workoutInfo}>
            <Text style={styles.memberName}>{memberName}</Text>
            <Text style={styles.workoutDate}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.workoutType}>
            <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.workoutDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{item.duration} minutes</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Calories:</Text>
            <Text style={styles.detailValue}>{item.caloriesBurned} kcal</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Exercises:</Text>
            <Text style={styles.detailValue}>{item.exercises.length} exercises</Text>
          </View>
          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => navigation.navigate('AdminEditWorkout', { workoutId: item.id })}
          >
            <Ionicons name="eye" size={20} color="white" />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => navigation.navigate('AdminEditWorkout', { workoutId: item.id })}
          >
            <Ionicons name="create" size={20} color="white" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteWorkout(item.id, new Date(item.date))}
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
        <Text style={styles.headerTitle}>Manage Workouts</Text>
        <Text style={styles.headerSubtitle}>{workouts.length} total workouts</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search workouts by member, type, or notes..."
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

        {/* Workouts List */}
        <FlatList
          data={filteredWorkouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="fitness-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No workouts found matching your search' : 'No workouts found'}
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
  workoutCard: {
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
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  workoutInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  workoutDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  workoutType: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  typeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  workoutDetails: {
    marginBottom: 15,
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
  notesContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  notesLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontStyle: 'italic',
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

export default AdminWorkoutsScreen; 