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

type AdminNavigationProp = StackNavigationProp<RootStackParamList & AdminTabParamList>;
import firebaseService from '../../services/firebaseService';
import { DietChart, Member } from '../../types';

const AdminDietChartsScreen = () => {
  const navigation = useNavigation<AdminNavigationProp>();
  const [dietCharts, setDietCharts] = useState<DietChart[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const [chartsData, membersData] = await Promise.all([
        firebaseService.getAllDietCharts(),
        firebaseService.getAllMembers(),
      ]);
      setDietCharts(chartsData);
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading diet charts data:', error);
      Alert.alert('Error', 'Failed to load diet charts data');
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

  const handleDeleteChart = (chartId: string, chartName: string) => {
    Alert.alert(
      'Delete Diet Chart',
      `Are you sure you want to delete "${chartName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseService.deleteDietChart(chartId);
              Alert.alert('Success', 'Diet chart deleted successfully');
              loadData(); // Reload the data
            } catch (error) {
              console.error('Error deleting diet chart:', error);
              Alert.alert('Error', 'Failed to delete diet chart');
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

  const filteredCharts = dietCharts.filter(chart => {
    const memberName = getMemberName(chart.memberId);
    return (
      memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chart.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chart.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const renderChartItem = ({ item }: { item: DietChart }) => {
    const memberName = getMemberName(item.memberId);
    const totalMeals = item.meals.length;
    
    return (
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={styles.chartInfo}>
            <Text style={styles.chartName}>{item.name}</Text>
            <Text style={styles.memberName}>{memberName}</Text>
          </View>
          <View style={[styles.statusContainer, { backgroundColor: item.isActive ? '#34C759' : '#FF9500' }]}>
            <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>

        <View style={styles.chartDetails}>
          <Text style={styles.descriptionText}>{item.description}</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Target Calories:</Text>
            <Text style={styles.detailValue}>{item.targetCalories} kcal</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>
              {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Meals:</Text>
            <Text style={styles.detailValue}>{totalMeals} meals per day</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => navigation.navigate('AdminEditDietChart', { chartId: item.id })}
          >
            <Ionicons name="eye" size={20} color="white" />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => navigation.navigate('AdminEditDietChart', { chartId: item.id })}
          >
            <Ionicons name="create" size={20} color="white" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteChart(item.id, item.name)}
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
        <Text style={styles.headerTitle}>Manage Diet Charts</Text>
        <Text style={styles.headerSubtitle}>{dietCharts.length} total charts</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search charts by member, name, or description..."
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

        {/* Charts List */}
        <FlatList
          data={filteredCharts}
          renderItem={renderChartItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No diet charts found matching your search' : 'No diet charts found'}
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
  chartCard: {
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
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chartInfo: {
    flex: 1,
  },
  chartName: {
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
  chartDetails: {
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

export default AdminDietChartsScreen; 