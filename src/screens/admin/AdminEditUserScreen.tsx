import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import firebaseService from '../../services/firebaseService';
import { Member, AuthUser } from '../../types';
import { useAuth } from '../../context/AuthContext';

const AdminEditUserScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params as { userId: string };

  const [member, setMember] = useState<Member | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    height: '',
    weight: '',
    gender: '',
    membershipStatus: '',
    membershipFee: '',
    membershipFeeStatus: '',
    membershipStartDate: '',
    membershipEndDate: '',
    nextPaymentDate: '',
  });

  const toDateString = (date: any) => {
    if (!date) return '';
    try { return new Date(date).toISOString().split('T')[0]; } 
    catch (e) { return ''; }
  };

  const [isActive, setIsActive] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    if (!user?.clanId) return;

    try {
      setLoading(true);
      const memberData = await firebaseService.getMember(userId);
      if (memberData) {
        setMember(memberData);
        setFormData({
          name: memberData.name,
          email: memberData.email,
          phone: memberData.phone,
          address: memberData.address,
          height: memberData.height.toString(),
          weight: memberData.weight.toString(),
          gender: memberData.gender,
          membershipStatus: memberData.membershipStatus,
          membershipFee: memberData.membershipFee.toString(),
          membershipFeeStatus: memberData.membershipFeeStatus,
          membershipStartDate: toDateString(memberData.membershipStartDate),
          membershipEndDate: toDateString(memberData.membershipEndDate),
          nextPaymentDate: toDateString(memberData.nextPaymentDate),
        });
      }

      // Get auth user data
      const authUsers = await firebaseService.getAllAuthUsers(user.clanId);
      const userAuth = authUsers.find(u => u.memberId === userId);
      if (userAuth) {
        setAuthUser(userAuth);
        setIsActive(userAuth.isActive);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!member) return;

    try {
      setSaving(true);

      // Validate required fields
      if (!formData.name.trim() || !formData.email.trim()) {
        Alert.alert('Error', 'Name and email are required');
        return;
      }

      // Update member data
      const updatedMember: Partial<Member> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        height: parseFloat(formData.height) || 0,
        weight: parseFloat(formData.weight) || 0,
        gender: formData.gender as 'male' | 'female' | 'other',
        membershipStatus: formData.membershipStatus as 'active' | 'expired' | 'pending',
        membershipFee: parseFloat(formData.membershipFee) || 600,
        membershipFeeStatus: formData.membershipFeeStatus as 'paid' | 'pending' | 'overdue',
      };

      try {
        if (formData.membershipStartDate) updatedMember.membershipStartDate = new Date(formData.membershipStartDate).toISOString() as any;
        if (formData.membershipEndDate) updatedMember.membershipEndDate = new Date(formData.membershipEndDate).toISOString() as any;
        if (formData.nextPaymentDate) updatedMember.nextPaymentDate = new Date(formData.nextPaymentDate).toISOString() as any;
      } catch (e) {
        console.error('Invalid date format provided');
      }

      await firebaseService.updateMember(userId, updatedMember);

      // Update auth user if exists
      if (authUser) {
        await firebaseService.updateAuthUser(authUser.id, {
          isActive,
        });
      }

      Alert.alert('Success', 'User updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!member) return;

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${member.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (authUser) {
                await firebaseService.deleteAuthUser(authUser.id);
              }
              await firebaseService.deleteMember(userId);
              Alert.alert('Success', 'User deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B35', '#F7931E']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit User</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter full name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Enter address"
              multiline
            />
          </View>
        </View>

        {/* Physical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Information</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={formData.height}
                onChangeText={(text) => setFormData({ ...formData, height: text })}
                placeholder="Height"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={formData.weight}
                onChangeText={(text) => setFormData({ ...formData, weight: text })}
                placeholder="Weight"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.pickerContainer}>
              {['male', 'female', 'other'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.pickerOption,
                    formData.gender === gender && styles.pickerOptionSelected
                  ]}
                  onPress={() => setFormData({ ...formData, gender })}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    formData.gender === gender && styles.pickerOptionTextSelected
                  ]}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Membership Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Membership Status</Text>
            <View style={styles.pickerContainer}>
              {['active', 'expired', 'pending'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.pickerOption,
                    formData.membershipStatus === status && styles.pickerOptionSelected
                  ]}
                  onPress={() => setFormData({ ...formData, membershipStatus: status })}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    formData.membershipStatus === status && styles.pickerOptionTextSelected
                  ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Membership Fee</Text>
              <TextInput
                style={styles.input}
                value={formData.membershipFee}
                onChangeText={(text) => setFormData({ ...formData, membershipFee: text })}
                placeholder="Fee amount"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Fee Status</Text>
              <View style={styles.pickerContainer}>
                {['paid', 'pending', 'overdue'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.pickerOption,
                      formData.membershipFeeStatus === status && styles.pickerOptionSelected
                    ]}
                    onPress={() => setFormData({ ...formData, membershipFeeStatus: status })}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      formData.membershipFeeStatus === status && styles.pickerOptionTextSelected
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={formData.membershipStartDate}
              onChangeText={(text) => setFormData({ ...formData, membershipStartDate: text })}
              placeholder="e.g. 2026-06-25"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Expiry Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={formData.membershipEndDate}
                onChangeText={(text) => setFormData({ ...formData, membershipEndDate: text })}
                placeholder="e.g. 2027-06-25"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Next Payment (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={formData.nextPaymentDate}
                onChangeText={(text) => setFormData({ ...formData, nextPaymentDate: text })}
                placeholder="e.g. 2026-07-25"
              />
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Account Active</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isActive ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerActions: {
    flexDirection: 'row',
  },
  deleteButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#F9F9F9',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  pickerOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  pickerOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
});

export default AdminEditUserScreen; 