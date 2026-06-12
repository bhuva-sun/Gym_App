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
import { FitnessPlan, Member } from '../../types';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AdminEditFitnessPlanScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { planId } = route.params as { planId: string };

  const [plan, setPlan] = useState<FitnessPlan | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goal: '',
  });
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadPlanData();
  }, [planId]);

  const loadPlanData = async () => {
    try {
      setLoading(true);
      const planData = await firebaseService.getFitnessPlan(planId);
      if (planData) {
        setPlan(planData);
        setFormData({
          name: planData.name,
          description: planData.description || '',
          goal: planData.goal,
        });
        setIsActive(planData.isActive);

        // Load member info
        const memberData = await firebaseService.getMember(planData.memberId);
        if (memberData) {
          setMember(memberData);
        }
      }
    } catch (error) {
      console.error('Error loading fitness plan data:', error);
      Alert.alert('Error', 'Failed to load fitness plan data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!plan) return;

    try {
      setSaving(true);

      if (!formData.name.trim()) {
        Alert.alert('Error', 'Plan name is required');
        return;
      }

      const updatedPlan: Partial<FitnessPlan> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        goal: formData.goal as FitnessPlan['goal'],
        isActive,
      };

      await firebaseService.updateFitnessPlan(planId, updatedPlan);

      Alert.alert('Success', 'Fitness plan updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error updating fitness plan:', error);
      Alert.alert('Error', 'Failed to update fitness plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!plan) return;

    Alert.alert(
      'Delete Fitness Plan',
      `Are you sure you want to delete "${plan.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseService.deleteFitnessPlan(planId);
              Alert.alert('Success', 'Fitness plan deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error('Error deleting fitness plan:', error);
              Alert.alert('Error', 'Failed to delete fitness plan');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading fitness plan...</Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Fitness plan not found</Text>
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
        <Text style={styles.headerTitle}>Edit Fitness Plan</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Member & Date Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Info</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member</Text>
            <Text style={styles.infoValue}>
              {member?.name || 'Unknown Member'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned By</Text>
            <Text style={styles.infoValue}>{plan.assignedBy}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>
              {new Date(plan.startDate).toLocaleDateString()} –{' '}
              {new Date(plan.endDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Editable Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Plan Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter plan name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              placeholder="Describe the plan..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal</Text>
            <View style={styles.pickerContainer}>
              {[
                { key: 'weight_loss', label: 'Weight Loss' },
                { key: 'muscle_gain', label: 'Muscle Gain' },
                { key: 'endurance', label: 'Endurance' },
                { key: 'flexibility', label: 'Flexibility' },
                { key: 'general_fitness', label: 'General' },
              ].map((goal) => (
                <TouchableOpacity
                  key={goal.key}
                  style={[
                    styles.pickerOption,
                    formData.goal === goal.key && styles.pickerOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, goal: goal.key })}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      formData.goal === goal.key &&
                        styles.pickerOptionTextSelected,
                    ]}
                  >
                    {goal.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Active</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isActive ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Workout Templates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Workout Templates ({plan.workoutTemplates.length})
          </Text>

          {plan.workoutTemplates.map((template, index) => (
            <View key={template.id || index} style={styles.templateCard}>
              <View style={styles.templateHeader}>
                <Text style={styles.templateName}>{template.name}</Text>
                <View style={styles.templateBadge}>
                  <Text style={styles.templateBadgeText}>
                    {DAYS_OF_WEEK[template.dayOfWeek] || `Day ${template.dayOfWeek}`}
                  </Text>
                </View>
              </View>
              <View style={styles.templateDetails}>
                <Text style={styles.templateDetail}>
                  {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                </Text>
                <Text style={styles.templateDetail}>
                  {template.duration} min
                </Text>
                <Text style={styles.templateDetail}>
                  {template.exercises.length} exercises
                </Text>
              </View>
            </View>
          ))}

          {plan.workoutTemplates.length === 0 && (
            <Text style={styles.emptyText}>No workout templates defined</Text>
          )}
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
    shadowOffset: { width: 0, height: 2 },
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  infoLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    maxWidth: '60%',
    textAlign: 'right',
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    fontSize: 13,
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
  templateCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  templateBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  templateBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  templateDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  templateDetail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyText: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
    paddingVertical: 20,
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

export default AdminEditFitnessPlanScreen;