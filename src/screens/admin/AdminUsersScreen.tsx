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
import { Member, AuthUser } from '../../types';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';

type AdminNavigationProp = StackNavigationProp<RootStackParamList>;

const AdminUsersScreen = () => {
  const navigation = useNavigation<AdminNavigationProp>();
  const [members, setMembers] = useState<Member[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [clan, setClan] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { user } = useAuth();
  
  const loadData = async () => {
    if (!user?.clanId) return;

    try {
      const clanId = user.clanId;
      const [membersData, authUsersData, clanData] = await Promise.all([
        firebaseService.getMembersByClan(clanId),
        firebaseService.getAllAuthUsers(clanId),
        firebaseService.getClan(clanId),
      ]);
      setMembers(membersData);
      setAuthUsers(authUsersData);
      setClan(clanData);
    } catch (error) {
      console.error('Error loading users data:', error);
      Alert.alert('Error', 'Failed to load users data');
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

  const handleDeleteUser = (memberId: string, memberName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${memberName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Find the auth user associated with this member
              const authUser = authUsers.find(user => user.memberId === memberId);
              if (authUser) {
                await firebaseService.deleteAuthUser(authUser.id);
              }
              await firebaseService.deleteMember(memberId);
              Alert.alert('Success', 'User deleted successfully');
              loadData(); // Reload the data
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMemberItem = ({ item }: { item: Member }) => {
    const authUser = authUsers.find(user => user.memberId === item.id);
    
    return (
      <View style={styles.memberCard}>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberEmail}>{item.email}</Text>
          <View style={styles.memberDetails}>
            <Text style={styles.memberDetail}>
              Status: <Text style={styles.statusText}>{item.membershipStatus}</Text>
            </Text>
            <Text style={styles.memberDetail}>
              Fee: <Text style={styles.feeText}>{item.membershipFeeStatus}</Text>
            </Text>
            <Text style={styles.memberDetail}>
              Role: <Text style={styles.roleText}>{authUser?.role || 'member'}</Text>
            </Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => navigation.navigate('AdminEditUser', { userId: item.id })}
          >
            <Ionicons name="create" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteUser(item.id, item.name)}
          >
            <Ionicons name="trash" size={20} color="white" />
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
        <Text style={styles.headerTitle}>Manage Users</Text>
        <Text style={styles.headerSubtitle}>{clan ? `${clan.name} • ` : ''}{members.length} total members</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members by name or email..."
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

        {/* Members List */}
        <FlatList
          data={filteredMembers}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No members found matching your search' : 'No members found'}
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  memberDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  memberDetail: {
    fontSize: 12,
    color: '#8E8E93',
    marginRight: 15,
  },
  statusText: {
    color: '#34C759',
    fontWeight: '600',
  },
  feeText: {
    color: '#FF9500',
    fontWeight: '600',
  },
  roleText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
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

export default AdminUsersScreen; 