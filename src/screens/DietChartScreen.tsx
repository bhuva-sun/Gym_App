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
import { DietChart } from '../types';
import { COLORS, GRADIENTS, RADIUS, SHADOWS, TYPOGRAPHY } from '../config/theme';

const DietChartScreen = () => {
  const { user } = useAuth();
  const [dietChart, setDietChart] = useState<DietChart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDietChart();
  }, []);

  const loadDietChart = async () => {
    if (!user?.memberId) { setIsLoading(false); return; }
    try {
      const chart = await firebaseService.getDietChartByMember(user.memberId);
      setDietChart(chart);
    } catch (error) {
      console.error('Error loading diet chart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDietChart();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.diet} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Diet Chart</Text>
          <Pressable style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color={COLORS.textWhite} />
          </Pressable>
        </View>
        <Text style={styles.headerSubtitle}>Your personalized nutrition plan</Text>
      </LinearGradient>

      <ScrollView
        style={[styles.scrollView, Platform.OS === 'web' && { overflow: 'auto' as any }]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={Platform.OS !== 'web'}
      >
        {dietChart ? (
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartName}>{dietChart.name}</Text>
              <View style={[styles.goalBadge, { backgroundColor: COLORS.success + '15' }]}>
                <Text style={[styles.goalText, { color: COLORS.success }]}>
                  {dietChart.goal.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.chartDesc}>{dietChart.description}</Text>
            <View style={styles.calorieCard}>
              <Ionicons name="flame" size={24} color={COLORS.warning} />
              <Text style={styles.calorieValue}>{dietChart.targetCalories}</Text>
              <Text style={styles.calorieLabel}>Daily Calories</Text>
            </View>

            {dietChart.meals.map((meal) => (
              <View key={meal.id} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <Ionicons name="restaurant" size={18} color={COLORS.primary} />
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealTime}>{meal.time}</Text>
                </View>
                {meal.foods.map((food) => (
                  <View key={food.id} style={styles.foodRow}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={styles.foodMacro}>{food.calories} cal</Text>
                  </View>
                ))}
                <View style={styles.mealTotal}>
                  <Text style={styles.mealTotalText}>Total: {meal.totalCalories} cal</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="restaurant-outline" size={64} color={COLORS.success} />
            </View>
            <Text style={styles.emptyTitle}>No Diet Chart Assigned</Text>
            <Text style={styles.emptySubtitle}>
              Your trainer will create a personalized diet plan based on your goals and nutritional needs.
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
  chartContainer: {},
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chartName: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary },
  goalBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.full },
  goalText: { ...TYPOGRAPHY.caption, fontWeight: '600' },
  chartDesc: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, marginBottom: 16 },
  calorieCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 20,
    alignItems: 'center', ...SHADOWS.small, marginBottom: 16, gap: 6,
  },
  calorieValue: { ...TYPOGRAPHY.h1, color: COLORS.textPrimary },
  calorieLabel: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  mealCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16,
    ...SHADOWS.small, marginBottom: 12,
  },
  mealHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  mealName: { ...TYPOGRAPHY.label, color: COLORS.textPrimary, flex: 1 },
  mealTime: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary },
  foodRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  foodName: { ...TYPOGRAPHY.bodySmall, color: COLORS.textPrimary },
  foodMacro: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
  mealTotal: { paddingTop: 8, alignItems: 'flex-end' },
  mealTotalText: { ...TYPOGRAPHY.label, color: COLORS.primary },
  emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIconContainer: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.success + '15',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtitle: {
    ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center',
    marginBottom: 24, lineHeight: 22,
  },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.full, gap: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  contactPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  contactBtnText: { ...TYPOGRAPHY.button, color: COLORS.textWhite },
  pressed: { opacity: 0.7 },
});

export default DietChartScreen;