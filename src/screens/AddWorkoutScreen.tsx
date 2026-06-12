import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import firebaseService from '../services/firebaseService';
import { COLORS, RADIUS, SHADOWS, TYPOGRAPHY } from '../config/theme';

const WORKOUT_TYPES = [
  { key: 'strength', label: 'Strength', icon: 'fitness', color: COLORS.info },
  { key: 'cardio', label: 'Cardio', icon: 'heart', color: COLORS.danger },
  { key: 'flexibility', label: 'Flexibility', icon: 'body', color: COLORS.success },
  { key: 'mixed', label: 'Mixed', icon: 'grid', color: COLORS.warning },
] as const;

const AddWorkoutScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [workoutType, setWorkoutType] = useState<string>('strength');
  const [workoutName, setWorkoutName] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!duration) {
      Alert.alert('Error', 'Please enter workout duration');
      return;
    }

    if (!user?.memberId) {
      Alert.alert('Error', 'No member data found');
      return;
    }

    setIsLoading(true);
    try {
      await firebaseService.createWorkout({
        memberId: user.memberId,
        clanId: user.clanId || '',
        date: new Date(date),
        duration: parseInt(duration),
        type: workoutType as any,
        name: workoutName || undefined,
        caloriesBurned: calories ? parseInt(calories) : undefined,
        notes: notes,
        exercises: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      Alert.alert('Success', 'Workout added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error adding workout:', error);
      Alert.alert('Error', 'Failed to add workout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Workout</Text>
        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed, isLoading && styles.disabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={[styles.scrollView, Platform.OS === 'web' && { overflow: 'auto' as any }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={Platform.OS !== 'web'}
      >
        {/* Workout Type */}
        <View style={styles.section}>
          <View style={styles.fieldRow}>
            <Ionicons name="barbell-outline" size={18} color={COLORS.primary} />
            <Text style={styles.fieldLabel}>Workout Type</Text>
          </View>
          <View style={styles.typeGrid}>
            {WORKOUT_TYPES.map((type) => (
              <Pressable
                key={type.key}
                style={({ pressed }) => [
                  styles.typeCard,
                  workoutType === type.key && [styles.typeCardActive, { borderColor: type.color }],
                  pressed && styles.pressed,
                ]}
                onPress={() => setWorkoutType(type.key)}
              >
                <View style={[styles.typeIconWrap, { backgroundColor: (workoutType === type.key ? type.color : COLORS.textTertiary) + '15' }]}>
                  <Ionicons name={type.icon as any} size={20} color={workoutType === type.key ? type.color : COLORS.textTertiary} />
                </View>
                <Text style={[styles.typeLabel, workoutType === type.key && { color: type.color, fontWeight: '600' }]}>
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Workout Name */}
        <View style={styles.section}>
          <View style={styles.fieldRow}>
            <Ionicons name="text-outline" size={18} color={COLORS.primary} />
            <Text style={styles.fieldLabel}>Workout Name</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter workout name (optional)"
              placeholderTextColor={COLORS.textTertiary}
              value={workoutName}
              onChangeText={setWorkoutName}
            />
          </View>
        </View>

        {/* Date & Duration */}
        <View style={styles.section}>
          <View style={styles.rowFields}>
            <View style={styles.halfField}>
              <View style={styles.fieldRow}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                <Text style={styles.fieldLabel}>Date</Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>
            </View>
            <View style={styles.halfField}>
              <View style={styles.fieldRow}>
                <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                <Text style={styles.fieldLabel}>Duration *</Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Minutes"
                  placeholderTextColor={COLORS.textTertiary}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Calories */}
        <View style={styles.section}>
          <View style={styles.fieldRow}>
            <Ionicons name="flame-outline" size={18} color={COLORS.warning} />
            <Text style={styles.fieldLabel}>Calories Burned (Optional)</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter calories"
              placeholderTextColor={COLORS.textTertiary}
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.fieldRow}>
            <Ionicons name="create-outline" size={18} color={COLORS.primary} />
            <Text style={styles.fieldLabel}>Notes (Optional)</Text>
          </View>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any notes about your workout..."
              placeholderTextColor={COLORS.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'web' ? 16 : 50, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center', alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  headerTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary },
  saveBtn: {
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: RADIUS.sm,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  saveBtnPressed: { opacity: 0.7 },
  saveBtnText: { ...TYPOGRAPHY.button, color: COLORS.primary },
  disabled: { opacity: 0.5 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 20 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  fieldLabel: { ...TYPOGRAPHY.label, color: COLORS.textPrimary },
  typeGrid: { flexDirection: 'row', gap: 10 },
  typeCard: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.borderLight,
    ...SHADOWS.small, gap: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  typeCardActive: { borderWidth: 2 },
  typeIconWrap: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  typeLabel: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  inputContainer: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1.5,
    borderColor: COLORS.borderLight, paddingHorizontal: 16, height: 48,
    justifyContent: 'center',
  },
  textAreaContainer: { height: 100, paddingVertical: 12 },
  input: {
    ...TYPOGRAPHY.bodySmall, color: COLORS.textPrimary, height: '100%',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  textArea: { textAlignVertical: 'top' },
  rowFields: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  pressed: { opacity: 0.7 },
});

export default AddWorkoutScreen;