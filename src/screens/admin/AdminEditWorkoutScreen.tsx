import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import firebaseService from '../../services/firebaseService';
import { Workout, Member } from '../../types';

const AdminEditWorkoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { workoutId } = route.params as { workoutId: string };

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    duration: '',
    type: '',
    caloriesBurned: '',
    notes: '',
  });

  useEffect(() => {
    loadWorkoutData();
  }, [workoutId]);

  const loadWorkoutData = async () => {
    try {
      setLoading(true);
      const workoutData = await firebaseService.getWorkout(workoutId);
      if (workoutData) {
        setWorkout(workoutData);
        setFormData({
          duration: workoutData.duration.toString(),
          type: workoutData.type,
          caloriesBurned: (workoutData.caloriesBurned || 0).toString(),
          notes: workoutData.notes || '',
        });

        // Load member info
        const memberData = await firebaseService.getMember(workoutData.memberId);
        if (memberData) {
          setMember(memberData);
        }
      }
    } catch (error) {
      console.error('Error loading workout data:', error);
      Alert.alert('Error', 'Failed to load workout data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!workout) return;

    try {
      setSaving(true);

      if (!formData.duration.trim()) {
        Alert.alert('Error', 'Duration is required');
        return;
      }

      const updatedWorkout: Partial<Workout> = {
        duration: parseInt(formData.duration) || 0,
        type: formData.type as 'cardio' | 'strength' | 'flexibility' | 'mixed',
        caloriesBurned: parseInt(formData.caloriesBurned) || 0,
        notes: formData.notes.trim(),
      };

      await firebaseService.updateWorkout(workoutId, updatedWorkout);

      Alert.alert('Success', 'Workout updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error updating workout:', error);
      Alert.alert('Error', 'Failed to update workout');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!workout) return;

    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseService.deleteWorkout(workoutId);
              Alert.alert('Success', 'Workout deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error deleting workout:', error);
              Alert.alert('Error', 'Failed to delete workout');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading workout data...</Text>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Workout not found</Text>
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
        <Text style={styles.headerTitle}>Edit Workout</Text>
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
        {/* Member & Date Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Info</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member</Text>
            <Text style={styles.infoValue}>{member?.name || 'Unknown Member'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {new Date(workout.date).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Workout Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Workout Type</Text>
            <View style={styles.pickerContainer}>
              {['cardio', 'strength', 'flexibility', 'mixed'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickerOption,
                    formData.type === type && styles.pickerOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, type })}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      formData.type === type && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Duration (min) *</Text>
              <TextInput
                style={styles.input}
                value={formData.duration}
                onChangeText={(text) => setFormData({ ...formData, duration: text })}
                placeholder="Minutes"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Calories Burned</Text>
              <TextInput
                style={styles.input}
                value={formData.caloriesBurned}
                onChangeText={(text) =>
                  setFormData({ ...formData, caloriesBurned: text })
                }
                placeholder="kcal"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Workout notes..."
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Exercises */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Exercises ({workout.exercises.length})
          </Text>

          {workout.exercises.map((exercise, index) => (
            <View key={exercise.id || index} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <View style={styles.exerciseBadge}>
                  <Text style={styles.exerciseBadgeText}>#{index + 1}</Text>
                </View>
              </View>
              <View style={styles.exerciseDetails}>
                <Text style={styles.exerciseDetail}>
                  {exercise.sets} sets × {exercise.reps} reps
                </Text>
                {exercise.weight !== undefined && exercise.weight > 0 && (
                  <Text style={styles.exerciseDetail}>
                    {exercise.weight} kg
                  </Text>
                )}
                {exercise.restTime !== undefined && exercise.restTime > 0 && (
                  <Text style={styles.exerciseDetail}>
                    Rest: {exercise.restTime}s
                  </Text>
                )}
              </View>
              {exercise.notes && (
                <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
              )}
            </View>
          ))}

          {workout.exercises.length === 0 && (
            <Text style={styles.emptyText}>No exercises recorded</Text>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
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
  exerciseCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  exerciseBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  exerciseBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  exerciseDetail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  exerciseNotes: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 6,
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

export default AdminEditWorkoutScreen;