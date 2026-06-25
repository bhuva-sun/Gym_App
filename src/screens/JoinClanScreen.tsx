import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { COLORS, GRADIENTS, RADIUS, SHADOWS, TYPOGRAPHY } from '../config/theme';

const JoinClanScreen = () => {
  const { createClan, joinClan, logout } = useAuth();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [clanName, setClanName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleCreateClan = async () => {
    setMessage('');
    if (!clanName.trim()) {
      setMessageType('error');
      setMessage('Please enter a gym/clan name');
      return;
    }
    setIsLoading(true);
    try {
      const newClan = await createClan(clanName.trim());
      setMessageType('success');
      setMessage(`Clan Created! 🎉\n\nYour invite code is: ${newClan.inviteCode}\n\nShare this code with your gym members so they can join.`);
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.message || 'Failed to create clan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClan = async () => {
    setMessage('');
    if (inviteCode.length !== 6) {
      setMessageType('error');
      setMessage('Please enter a valid 6-character invite code');
      return;
    }
    setIsLoading(true);
    try {
      const clan = await joinClan(inviteCode.toUpperCase());
      setMessageType('success');
      setMessage(`Welcome! 🎉 You've joined ${clan.name}`);
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.message || 'Invalid invite code');
    } finally {
      setIsLoading(false);
    }
  };

  const renderChoose = () => (
    <View style={styles.optionsContainer}>
      <Text style={styles.chooseTitle}>Join or Create a Clan</Text>
      <Text style={styles.chooseSubtitle}>
        A clan is your gym community. Owners manage members, assign workout plans, and track progress.
      </Text>

      <Pressable
        style={({ pressed }) => [styles.optionCard, pressed && styles.cardPressed]}
        onPress={() => setMode('create')}
      >
        <View style={[styles.optionIconWrap, { backgroundColor: COLORS.primary + '15' }]}>
          <Ionicons name="add-circle" size={28} color={COLORS.primary} />
        </View>
        <View style={styles.optionInfo}>
          <Text style={styles.optionTitle}>Create a Clan</Text>
          <Text style={styles.optionDesc}>You're a gym owner and want to manage your members</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.optionCard, pressed && styles.cardPressed]}
        onPress={() => setMode('join')}
      >
        <View style={[styles.optionIconWrap, { backgroundColor: COLORS.success + '15' }]}>
          <Ionicons name="people" size={28} color={COLORS.success} />
        </View>
        <View style={styles.optionInfo}>
          <Text style={styles.optionTitle}>Join with Code</Text>
          <Text style={styles.optionDesc}>Your gym owner shared an invite code with you</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.logoutLink, pressed && styles.pressed]}
        onPress={logout}
      >
        <Ionicons name="log-out-outline" size={16} color={COLORS.danger} />
        <Text style={styles.logoutLinkText}>Logout</Text>
      </Pressable>
    </View>
  );

  const renderCreate = () => (
    <View style={styles.formContainer}>
      <Pressable style={({ pressed }) => [styles.backRow, pressed && styles.pressed]} onPress={() => setMode('choose')}>
        <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <View style={styles.formIconContainer}>
        <Ionicons name="shield-checkmark" size={48} color={COLORS.primary} />
      </View>
      <Text style={styles.formTitle}>Create Your Clan</Text>
      <Text style={styles.formSubtitle}>Set up your gym community. You'll get an invite code to share with members.</Text>
      
      <View style={styles.inputContainer}>
        <Ionicons name="business-outline" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Gym / Clan Name"
          placeholderTextColor={COLORS.textTertiary}
          value={clanName}
          onChangeText={setClanName}
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.actionButton, isLoading && styles.disabled, pressed && !isLoading && styles.actionPressed]}
        onPress={handleCreateClan}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.textWhite} size="small" />
        ) : (
          <>
            <Ionicons name="rocket" size={18} color={COLORS.textWhite} />
            <Text style={styles.actionButtonText}>Create Clan</Text>
          </>
        )}
      </Pressable>
    </View>
  );

  const renderJoin = () => (
    <View style={styles.formContainer}>
      <Pressable style={({ pressed }) => [styles.backRow, pressed && styles.pressed]} onPress={() => setMode('choose')}>
        <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <View style={styles.formIconContainer}>
        <Ionicons name="ticket" size={48} color={COLORS.success} />
      </View>
      <Text style={styles.formTitle}>Join a Clan</Text>
      <Text style={styles.formSubtitle}>Enter the 6-character invite code shared by your gym owner.</Text>

      {message ? (
        <View style={[styles.messageBox, messageType === 'success' ? styles.messageSuccess : styles.messageError]}>
          <Text style={[styles.messageText, messageType === 'success' ? styles.messageTextSuccess : styles.messageTextError]}>
            {message}
          </Text>
        </View>
      ) : null}

      <View style={styles.codeContainer}>
        <TextInput
          style={styles.codeInput}
          placeholder="XXXXXX"
          placeholderTextColor={COLORS.borderLight}
          value={inviteCode}
          onChangeText={(v) => setInviteCode(v.toUpperCase())}
          maxLength={6}
          autoCapitalize="characters"
          textAlign="center"
        />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.actionButton,
          { backgroundColor: COLORS.success },
          isLoading && styles.disabled,
          pressed && !isLoading && styles.actionPressed,
        ]}
        onPress={handleJoinClan}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.textWhite} size="small" />
        ) : (
          <>
            <Ionicons name="enter" size={18} color={COLORS.textWhite} />
            <Text style={styles.actionButtonText}>Join Clan</Text>
          </>
        )}
      </Pressable>
    </View>
  );

  return (
    <LinearGradient colors={GRADIENTS.primary} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          style={Platform.OS === 'web' ? { overflow: 'auto' as any } : undefined}
        >
          <View style={styles.header}>
            <Ionicons name="people-circle" size={60} color={COLORS.textWhite} />
            <Text style={styles.headerTitle}>Welcome to TheGymEye</Text>
          </View>

          <View style={styles.card}>
            {mode === 'choose' && renderChoose()}
            {mode === 'create' && renderCreate()}
            {mode === 'join' && renderJoin()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 28, gap: 12 },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.textWhite },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 28, ...SHADOWS.large,
  },
  optionsContainer: {},
  chooseTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, textAlign: 'center', marginBottom: 8 },
  chooseSubtitle: {
    ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, textAlign: 'center',
    marginBottom: 24, lineHeight: 20,
  },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md, padding: 16, marginBottom: 12, gap: 14,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  optionIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  optionInfo: { flex: 1 },
  optionTitle: { ...TYPOGRAPHY.label, color: COLORS.textPrimary, marginBottom: 2 },
  optionDesc: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, lineHeight: 16 },
  logoutLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 20, gap: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  logoutLinkText: { ...TYPOGRAPHY.bodySmall, color: COLORS.danger },
  formContainer: {},
  backRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  backText: { ...TYPOGRAPHY.label, color: COLORS.primary },
  formIconContainer: { alignItems: 'center', marginBottom: 16 },
  formTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, textAlign: 'center', marginBottom: 8 },
  formSubtitle: {
    ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, textAlign: 'center',
    marginBottom: 24, lineHeight: 20,
  },
  messageBox: {
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 16,
    alignItems: 'center',
  },
  messageSuccess: {
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.success,
    borderWidth: 1,
  },
  messageError: {
    backgroundColor: COLORS.dangerLight,
    borderColor: COLORS.danger,
    borderWidth: 1,
  },
  messageText: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  messageTextSuccess: {
    color: COLORS.success,
  },
  messageTextError: {
    color: COLORS.danger,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
    borderColor: COLORS.borderLight, borderRadius: RADIUS.md,
    paddingHorizontal: 16, height: 52, backgroundColor: COLORS.surfaceSecondary, marginBottom: 20,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1, ...TYPOGRAPHY.body, color: COLORS.textPrimary, height: '100%',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  codeContainer: { marginBottom: 24 },
  codeInput: {
    borderWidth: 2, borderColor: COLORS.success, borderRadius: RADIUS.lg,
    height: 64, fontSize: 28, fontWeight: 'bold', letterSpacing: 10,
    color: COLORS.textPrimary, backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: 20,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 52, gap: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  actionPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  actionButtonText: { ...TYPOGRAPHY.button, color: COLORS.textWhite },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.7 },
});

export default JoinClanScreen;
