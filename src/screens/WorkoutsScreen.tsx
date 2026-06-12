import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import firebaseService from '../services/firebaseService';
import { Workout } from '../types';
import { COLORS, GRADIENTS, RADIUS, SHADOWS, TYPOGRAPHY } from '../config/theme';

const WorkoutsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    if (!user?.memberId) {
      setIsLoading(false);
      return;
    }
    try {
      const workoutData = await firebaseService.getWorkoutsByMember(user.memberId);
      setWorkouts(workoutData);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkouts();
    setRefreshing(false);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getWorkoutTypeIcon = (type: string): any => {
    switch (type) {
      case 'cardio': return 'heart';
      case 'strength': return 'fitness';
      case 'flexibility': return 'body';
      case 'mixed': return 'grid';
      default: return 'fitness';
    }
  };

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'cardio': return COLORS.danger;
      case 'strength': return COLORS.info;
      case 'flexibility': return COLORS.success;
      case 'mixed': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const renderWorkoutItem = ({ item }: { item: Workout }) => (
    <Pressable style={({ pressed }) => [styles.workoutCard, pressed && styles.cardPressed]}>
      <View style={styles.workoutHeader}>
        <View style={[styles.workoutIcon, { backgroundColor: getWorkoutTypeColor(item.type) + '15' }]}>
          <Ionicons name={getWorkoutTypeIcon(item.type)} size={22} color={getWorkoutTypeColor(item.type)} />
        </View>
        <View style={styles.workoutInfo}>
          <Text style={styles.workoutTitle}>
            {item.name || `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} Workout`}
          </Text>
          <Text style={styles.workoutDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.workoutStats}>
          <Text style={styles.workoutDuration}>{item.duration} min</Text>
          {item.caloriesBurned ? (
            <Text style={styles.workoutCalories}>{item.caloriesBurned} cal</Text>
          ) : null}
        </View>
      </View>

      {item.exercises && item.exercises.length > 0 && (
        <View style={styles.exercisesPreview}>
          {item.exercises.slice(0, 3).map((exercise) => (
            <View key={exercise.id} style={styles.exerciseChip}>
              <Text style={styles.exerciseChipText}>
                {exercise.name} ({exercise.sets}×{exercise.reps})
              </Text>
            </View>
          ))}
          {item.exercises.length > 3 && (
            <View style={[styles.exerciseChip, styles.moreChip]}>
              <Text style={styles.moreChipText}>+{item.exercises.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {item.notes ? (
        <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
      ) : null}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.workout} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Workouts</Text>
          <Pressable
            style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={20} color={COLORS.textWhite} />
          </Pressable>
        </View>
        <Text style={styles.headerSubtitle}>
          {workouts.length > 0 ? `${workouts.length} workouts completed` : 'Track your fitness journey'}
        </Text>
      </LinearGradient>

      <FlatList
        data={workouts}
        renderItem={renderWorkoutItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={Platform.OS !== 'web'}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="fitness-outline" size={64} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Workouts Yet</Text>
            <Text style={styles.emptySubtitle}>
              Start your fitness journey by adding your first workout!
            </Text>
            <Pressable
              style={({ pressed }) => [styles.addWorkoutBtn, pressed && styles.addBtnPressed]}
              onPress={() => navigation.navigate('AddWorkout')}
            >
              <Ionicons name="add" size={20} color={COLORS.textWhite} />
              <Text style={styles.addWorkoutBtnText}>Add Workout</Text>
            </Pressable>
          </View>
        }
      />

      {/* FAB */}
      {workouts.length > 0 && (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => navigation.navigate('AddWorkout')}
        >
          <Ionicons name="add" size={28} color={COLORS.textWhite} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textWhite,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  headerSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255,255,255,0.8)',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 80,
  },
  workoutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.small,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  workoutDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  workoutStats: {
    alignItems: 'flex-end',
  },
  workoutDuration: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
  },
  workoutCalories: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  exercisesPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 6,
  },
  exerciseChip: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  exerciseChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  moreChip: {
    backgroundColor: COLORS.primaryLight + '20',
  },
  moreChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  notesText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  addWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    gap: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  addBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  addWorkoutBtnText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textWhite,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  pressed: {
    opacity: 0.7,
  },
});

export default WorkoutsScreen;