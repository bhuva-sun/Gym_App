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
import { ProgressLog, Member } from '../../types';
import { RootStackParamList, AdminTabParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';

type AdminNavigationProp = StackNavigationProp<RootStackParamList & AdminTabParamList>;

const AdminProgressScreen = () => {
  const navigation = useNavigation<AdminNavigationProp>();
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { user } = useAuth();

  const loadData = async () => {
    if (!user?.clanId) return;

    try {
      const clanId = user.clanId;
      const [logsData, membersData] = await Promise.all([
        firebaseService.getAllProgressLogs(clanId),
        firebaseService.getMembersByClan(clanId),
      ]);
      setProgressLogs(logsData);
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading progress data:', error);
      Alert.alert('Error', 'Failed to load progress data');
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

  const handleDeleteProgress = (progressId: string, progressDate: Date) => {
    Alert.alert(
      'Delete Progress Log',
      `Are you sure you want to delete the progress log from ${progressDate.toLocaleDateString()}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseService.deleteProgressLog(progressId);
              Alert.alert('Success', 'Progress log deleted successfully');
              loadData(); // Reload the data
            } catch (error) {
              console.error('Error deleting progress log:', error);
              Alert.alert('Error', 'Failed to delete progress log');
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

  const filteredProgressLogs = progressLogs.filter(progress => {
    const memberName = getMemberName(progress.memberId);
    return (
      memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      progress.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const renderProgressItem = ({ item }: { item: ProgressLog }) => {
    const memberName = getMemberName(item.memberId);
    
    return (
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View style={styles.progressInfo}>
            <Text style={styles.memberName}>{memberName}</Text>
            <Text style={styles.progressDate}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.weightContainer}>
            <Text style={styles.weightText}>{item.weight} kg</Text>
          </View>
        </View>

        <View style={styles.progressDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Body Fat:</Text>
            <Text style={styles.detailValue}>{item.bodyFat}%</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Muscle Mass:</Text>
            <Text style={styles.detailValue}>{item.muscleMass} kg</Text>
          </View>
          {item.measurements && (
            <View style={styles.measurementsContainer}>
              <Text style={styles.measurementsLabel}>Measurements:</Text>
              <View style={styles.measurementsGrid}>
                <Text style={styles.measurementItem}>Chest: {item.measurements.chest}cm</Text>
                <Text style={styles.measurementItem}>Waist: {item.measurements.waist}cm</Text>
                <Text style={styles.measurementItem}>Hips: {item.measurements.hips}cm</Text>
                <Text style={styles.measurementItem}>Biceps: {item.measurements.biceps}cm</Text>
              </View>
            </View>
          )}
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
            onPress={() => navigation.navigate('AdminEditProgress', { progressId: item.id })}
          >
            <Ionicons name="eye" size={20} color="white" />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => navigation.navigate('AdminEditProgress', { progressId: item.id })}
          >
            <Ionicons name="create" size={20} color="white" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteProgress(item.id, new Date(item.date))}
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
        <Text style={styles.headerTitle}>Manage Progress</Text>
        <Text style={styles.headerSubtitle}>{progressLogs.length} total progress logs</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search progress by member or notes..."
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

        {/* Progress List */}
        <FlatList
          data={filteredProgressLogs}
          renderItem={renderProgressItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="trending-up-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No progress logs found matching your search' : 'No progress logs found'}
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
  progressCard: {
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  progressDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  weightContainer: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  weightText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  progressDetails: {
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
  measurementsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  measurementsLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  measurementItem: {
    fontSize: 12,
    color: '#1C1C1E',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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

export default AdminProgressScreen; 