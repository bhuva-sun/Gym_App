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
import { ProgressLog, Member, BodyMeasurements } from '../../types';

const AdminEditProgressScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { progressId } = route.params as { progressId: string };

  const [progress, setProgress] = useState<ProgressLog | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    weight: '',
    bodyFat: '',
    muscleMass: '',
    notes: '',
  });

  const [measurements, setMeasurements] = useState({
    chest: '',
    waist: '',
    hips: '',
    biceps: '',
    thighs: '',
    calves: '',
    neck: '',
  });

  useEffect(() => {
    loadProgressData();
  }, [progressId]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const progressData = await firebaseService.getProgressLog(progressId);
      if (progressData) {
        setProgress(progressData);
        setFormData({
          weight: progressData.weight.toString(),
          bodyFat: (progressData.bodyFat || 0).toString(),
          muscleMass: (progressData.muscleMass || 0).toString(),
          notes: progressData.notes || '',
        });

        if (progressData.measurements) {
          setMeasurements({
            chest: (progressData.measurements.chest || 0).toString(),
            waist: (progressData.measurements.waist || 0).toString(),
            hips: (progressData.measurements.hips || 0).toString(),
            biceps: (progressData.measurements.biceps || 0).toString(),
            thighs: (progressData.measurements.thighs || 0).toString(),
            calves: (progressData.measurements.calves || 0).toString(),
            neck: (progressData.measurements.neck || 0).toString(),
          });
        }

        // Load member info
        const memberData = await firebaseService.getMember(progressData.memberId);
        if (memberData) {
          setMember(memberData);
        }
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
      Alert.alert('Error', 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!progress) return;

    try {
      setSaving(true);

      if (!formData.weight.trim()) {
        Alert.alert('Error', 'Weight is required');
        return;
      }

      const updatedMeasurements: BodyMeasurements = {
        chest: parseFloat(measurements.chest) || 0,
        waist: parseFloat(measurements.waist) || 0,
        hips: parseFloat(measurements.hips) || 0,
        biceps: parseFloat(measurements.biceps) || 0,
        thighs: parseFloat(measurements.thighs) || 0,
        calves: parseFloat(measurements.calves) || 0,
        neck: parseFloat(measurements.neck) || 0,
      };

      const updatedProgress: Partial<ProgressLog> = {
        weight: parseFloat(formData.weight) || 0,
        bodyFat: parseFloat(formData.bodyFat) || 0,
        muscleMass: parseFloat(formData.muscleMass) || 0,
        notes: formData.notes.trim(),
        measurements: updatedMeasurements,
      };

      await firebaseService.updateProgressLog(progressId, updatedProgress);

      Alert.alert('Success', 'Progress log updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error updating progress log:', error);
      Alert.alert('Error', 'Failed to update progress log');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!progress) return;

    Alert.alert(
      'Delete Progress Log',
      'Are you sure you want to delete this progress log? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseService.deleteProgressLog(progressId);
              Alert.alert('Success', 'Progress log deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error('Error deleting progress log:', error);
              Alert.alert('Error', 'Failed to delete progress log');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading progress data...</Text>
      </View>
    );
  }

  if (!progress) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Progress log not found</Text>
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
        <Text style={styles.headerTitle}>Edit Progress</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Member & Date Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress Info</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member</Text>
            <Text style={styles.infoValue}>
              {member?.name || 'Unknown Member'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {new Date(progress.date).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Body Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Body Metrics</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.thirdWidth]}>
              <Text style={styles.label}>Weight (kg) *</Text>
              <TextInput
                style={styles.input}
                value={formData.weight}
                onChangeText={(text) =>
                  setFormData({ ...formData, weight: text })
                }
                placeholder="kg"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.thirdWidth]}>
              <Text style={styles.label}>Body Fat %</Text>
              <TextInput
                style={styles.input}
                value={formData.bodyFat}
                onChangeText={(text) =>
                  setFormData({ ...formData, bodyFat: text })
                }
                placeholder="%"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.thirdWidth]}>
              <Text style={styles.label}>Muscle (kg)</Text>
              <TextInput
                style={styles.input}
                value={formData.muscleMass}
                onChangeText={(text) =>
                  setFormData({ ...formData, muscleMass: text })
                }
                placeholder="kg"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) =>
                setFormData({ ...formData, notes: text })
              }
              placeholder="Progress notes..."
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Body Measurements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Body Measurements (cm)</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Chest</Text>
              <TextInput
                style={styles.input}
                value={measurements.chest}
                onChangeText={(text) =>
                  setMeasurements({ ...measurements, chest: text })
                }
                placeholder="cm"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Waist</Text>
              <TextInput
                style={styles.input}
                value={measurements.waist}
                onChangeText={(text) =>
                  setMeasurements({ ...measurements, waist: text })
                }
                placeholder="cm"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Hips</Text>
              <TextInput
                style={styles.input}
                value={measurements.hips}
                onChangeText={(text) =>
                  setMeasurements({ ...measurements, hips: text })
                }
                placeholder="cm"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Biceps</Text>
              <TextInput
                style={styles.input}
                value={measurements.biceps}
                onChangeText={(text) =>
                  setMeasurements({ ...measurements, biceps: text })
                }
                placeholder="cm"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.thirdWidth]}>
              <Text style={styles.label}>Thighs</Text>
              <TextInput
                style={styles.input}
                value={measurements.thighs}
                onChangeText={(text) =>
                  setMeasurements({ ...measurements, thighs: text })
                }
                placeholder="cm"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, styles.thirdWidth]}>
              <Text style={styles.label}>Calves</Text>
              <TextInput
                style={styles.input}
                value={measurements.calves}
                onChangeText={(text) =>
                  setMeasurements({ ...measurements, calves: text })
                }
                placeholder="cm"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, styles.thirdWidth]}>
              <Text style={styles.label}>Neck</Text>
              <TextInput
                style={styles.input}
                value={measurements.neck}
                onChangeText={(text) =>
                  setMeasurements({ ...measurements, neck: text })
                }
                placeholder="cm"
                keyboardType="numeric"
              />
            </View>
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
    fontSize: 14,
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
  thirdWidth: {
    width: '31%',
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

export default AdminEditProgressScreen;