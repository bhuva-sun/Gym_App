import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import firebaseService from '../services/firebaseService';
import { Notification } from '../types';
import { COLORS, GRADIENTS, RADIUS, SHADOWS, TYPOGRAPHY } from '../config/theme';

const NotificationsScreen = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    if (!user?.id) { setIsLoading(false); return; }
    try {
      const data = await firebaseService.getNotificationsByUser(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally { setIsLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await loadNotifications(); setRefreshing(false); };

  const handleMarkAsRead = async (id: string) => {
    try {
      await firebaseService.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) { console.error('Error marking notification as read:', error); }
  };

  const getNotificationIcon = (type: string): any => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'alert-circle';
      case 'membership_renewal': return 'card';
      default: return 'information-circle';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return COLORS.success;
      case 'warning': return COLORS.warning;
      case 'error': return COLORS.danger;
      case 'membership_renewal': return COLORS.info;
      default: return COLORS.primary;
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const color = getNotificationColor(item.type);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.notifCard,
          !item.isRead && styles.unreadCard,
          pressed && styles.cardPressed,
        ]}
        onPress={() => !item.isRead && handleMarkAsRead(item.id)}
      >
        <View style={[styles.notifIcon, { backgroundColor: color + '15' }]}>
          <Ionicons name={getNotificationIcon(item.type)} size={20} color={color} />
        </View>
        <View style={styles.notifContent}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.notifTime}>{formatTime(item.createdAt)}</Text>
        </View>
        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.notification} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Pressable style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color={COLORS.textWhite} />
          </Pressable>
        </View>
        <Text style={styles.headerSubtitle}>
          {notifications.filter(n => !n.isRead).length > 0
            ? `${notifications.filter(n => !n.isRead).length} unread notifications`
            : 'All caught up!'}
        </Text>
      </LinearGradient>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={Platform.OS !== 'web'}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="notifications-outline" size={64} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>You're all caught up! Check back later for updates.</Text>
          </View>
        }
      />
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
  list: { flex: 1 },
  listContent: { padding: 20, paddingBottom: 40 },
  notifCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16,
    flexDirection: 'row', alignItems: 'flex-start', ...SHADOWS.small, marginBottom: 10, gap: 12,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  unreadCard: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  cardPressed: { opacity: 0.95 },
  notifIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  notifContent: { flex: 1 },
  notifTitle: { ...TYPOGRAPHY.label, color: COLORS.textPrimary, marginBottom: 4 },
  notifMessage: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, lineHeight: 20 },
  notifTime: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIconContainer: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primaryLight + '15',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtitle: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  pressed: { opacity: 0.7 },
});

export default NotificationsScreen;