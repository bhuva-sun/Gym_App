import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import firebaseService from '../services/firebaseService';
import { FitnessPlan } from '../types';
import { COLORS, GRADIENTS, RADIUS, SHADOWS, TYPOGRAPHY } from '../config/theme';

const FitnessPlanScreen = () => {
  const { user } = useAuth();
  const [fitnessPlan, setFitnessPlan] = useState<FitnessPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadFitnessPlan(); }, []);

  const loadFitnessPlan = async () => {
    if (!user?.memberId) { setIsLoading(false); return; }
    try {
      const plan = await firebaseService.getFitnessPlanByMember(user.memberId);
      setFitnessPlan(plan);
    } catch (error) {
      console.error('Error loading fitness plan:', error);
    } finally { setIsLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await loadFitnessPlan(); setRefreshing(false); };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.fitness} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Fitness Plan</Text>
          <Pressable style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color={COLORS.textWhite} />
          </Pressable>
        </View>
        <Text style={styles.headerSubtitle}>Your personalized workout plan</Text>
      </LinearGradient>

      <ScrollView
        style={[styles.scrollView, Platform.OS === 'web' && { overflow: 'auto' as any }]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={Platform.OS !== 'web'}
      >
        {fitnessPlan ? (
          <View>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{fitnessPlan.name}</Text>
              <View style={[styles.goalBadge, { backgroundColor: COLORS.warning + '15' }]}>
                <Text style={[styles.goalText, { color: COLORS.warning }]}>
                  {fitnessPlan.goal.replace(/_/g, ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.planDesc}>{fitnessPlan.description}</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateItem}>
                <Ionicons name="calendar" size={16} color={COLORS.success} />
                <Text style={styles.dateText}>Start: {formatDate(fitnessPlan.startDate)}</Text>
              </View>
              <View style={styles.dateItem}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.danger} />
                <Text style={styles.dateText}>End: {formatDate(fitnessPlan.endDate)}</Text>
              </View>
            </View>

            {fitnessPlan.workoutTemplates.map((template) => (
              <View key={template.id} style={styles.templateCard}>
                <View style={styles.templateHeader}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayText}>{dayNames[template.dayOfWeek].slice(0, 3)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateMeta}>{template.duration} min • {template.type}</Text>
                  </View>
                </View>
                {template.exercises.map((ex) => (
                  <View key={ex.id} style={styles.exerciseRow}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.exerciseSets}>{ex.sets}×{ex.reps}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="flag-outline" size={64} color={COLORS.warning} />
            </View>
            <Text style={styles.emptyTitle}>No Fitness Plan Assigned</Text>
            <Text style={styles.emptySubtitle}>
              Your trainer will design a personalized fitness plan based on your goals and current fitness level.
            </Text>
            <Pressable style={({ pressed }) => [styles.contactBtn, pressed && styles.contactPressed]}>
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.textWhite} />
              <Text style={styles.contactBtnText}>Contact Trainer</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerGradient: {
    paddingTop: Platform.OS === 'web' ? 20 : 50, paddingBottom: 20, paddingHorizontal: 20,
    borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.textWhite },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  headerSubtitle: { ...TYPOGRAPHY.bodySmall, color: 'rgba(255,255,255,0.8)' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  planName: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary },
  goalBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.full },
  goalText: { ...TYPOGRAPHY.caption, fontWeight: '600' },
  planDesc: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, marginBottom: 16 },
  dateRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  templateCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16,
    ...SHADOWS.small, marginBottom: 12,
  },
  templateHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  dayBadge: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  dayText: { ...TYPOGRAPHY.label, color: COLORS.primary, fontWeight: '700' },
  templateName: { ...TYPOGRAPHY.label, color: COLORS.textPrimary },
  templateMeta: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, marginTop: 2 },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6,
    borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  exerciseName: { ...TYPOGRAPHY.bodySmall, color: COLORS.textPrimary, flex: 1 },
  exerciseSets: { ...TYPOGRAPHY.label, color: COLORS.textSecondary },
  emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIconContainer: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.warning + '15',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtitle: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.full, gap: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  contactPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  contactBtnText: { ...TYPOGRAPHY.button, color: COLORS.textWhite },
  pressed: { opacity: 0.7 },
});

export default FitnessPlanScreen;