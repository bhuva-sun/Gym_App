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
import { DietChart, Member } from '../../types';

const AdminEditDietChartScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { chartId } = route.params as { chartId: string };

  const [chart, setChart] = useState<DietChart | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goal: '',
    targetCalories: '',
  });
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [chartId]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      const chartData = await firebaseService.getDietChart(chartId);
      if (chartData) {
        setChart(chartData);
        setFormData({
          name: chartData.name,
          description: chartData.description || '',
          goal: chartData.goal,
          targetCalories: chartData.targetCalories.toString(),
        });
        setIsActive(chartData.isActive);

        // Load member info
        const memberData = await firebaseService.getMember(chartData.memberId);
        if (memberData) {
          setMember(memberData);
        }
      }
    } catch (error) {
      console.error('Error loading diet chart data:', error);
      Alert.alert('Error', 'Failed to load diet chart data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!chart) return;

    try {
      setSaving(true);

      if (!formData.name.trim()) {
        Alert.alert('Error', 'Chart name is required');
        return;
      }

      const updatedChart: Partial<DietChart> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        goal: formData.goal as DietChart['goal'],
        targetCalories: parseInt(formData.targetCalories) || 0,
        isActive,
      };

      await firebaseService.updateDietChart(chartId, updatedChart);

      Alert.alert('Success', 'Diet chart updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error updating diet chart:', error);
      Alert.alert('Error', 'Failed to update diet chart');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!chart) return;

    Alert.alert(
      'Delete Diet Chart',
      `Are you sure you want to delete "${chart.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseService.deleteDietChart(chartId);
              Alert.alert('Success', 'Diet chart deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error('Error deleting diet chart:', error);
              Alert.alert('Error', 'Failed to delete diet chart');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading diet chart...</Text>
      </View>
    );
  }

  if (!chart) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Diet chart not found</Text>
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
        <Text style={styles.headerTitle}>Edit Diet Chart</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Chart Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chart Info</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member</Text>
            <Text style={styles.infoValue}>
              {member?.name || 'Unknown Member'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned By</Text>
            <Text style={styles.infoValue}>{chart.assignedBy}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>
              {new Date(chart.startDate).toLocaleDateString()} –{' '}
              {new Date(chart.endDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Editable Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chart Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Chart Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter chart name"
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
              placeholder="Describe the diet chart..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Calories (kcal)</Text>
            <TextInput
              style={styles.input}
              value={formData.targetCalories}
              onChangeText={(text) =>
                setFormData({ ...formData, targetCalories: text })
              }
              placeholder="Daily calorie target"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal</Text>
            <View style={styles.pickerContainer}>
              {[
                { key: 'weight_loss', label: 'Weight Loss' },
                { key: 'muscle_gain', label: 'Muscle Gain' },
                { key: 'maintenance', label: 'Maintenance' },
                { key: 'health', label: 'Health' },
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

        {/* Meals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Meals ({chart.meals.length})
          </Text>

          {chart.meals.map((meal, index) => (
            <View key={meal.id || index} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <View style={styles.mealHeaderLeft}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealTime}>{meal.time}</Text>
                </View>
                <View style={styles.mealCalorieBadge}>
                  <Text style={styles.mealCalorieText}>
                    {meal.totalCalories} kcal
                  </Text>
                </View>
              </View>

              {meal.foods.length > 0 && (
                <View style={styles.foodsList}>
                  {meal.foods.map((food, foodIdx) => (
                    <View key={food.id || foodIdx} style={styles.foodItem}>
                      <Text style={styles.foodName}>{food.name}</Text>
                      <Text style={styles.foodDetail}>
                        {food.quantity} {food.unit} • {food.calories} kcal
                      </Text>
                      <Text style={styles.foodMacros}>
                        P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {meal.notes && (
                <Text style={styles.mealNotes}>{meal.notes}</Text>
              )}
            </View>
          ))}

          {chart.meals.length === 0 && (
            <Text style={styles.emptyText}>No meals defined</Text>
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
    gap: 8,
  },
  pickerOption: {
    flex: 1,
    padding: 10,
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
    fontSize: 12,
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
  mealCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealHeaderLeft: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  mealTime: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  mealCalorieBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  mealCalorieText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  foodsList: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 8,
  },
  foodItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  foodName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  foodDetail: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  foodMacros: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  mealNotes: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
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

export default AdminEditDietChartScreen;