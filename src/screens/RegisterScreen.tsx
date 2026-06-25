import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SHADOWS, TYPOGRAPHY } from '../config/theme';
import { ENV } from '../config/environment';

// Required for web redirect
WebBrowser.maybeCompleteAuthSession();

const RegisterScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    gender: 'male' as 'male' | 'female' | 'other',
    height: '',
    weight: '',
    inviteCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, loginWithGoogle } = useAuth();

  // Configure Google OAuth request
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: ENV.GOOGLE.WEB_CLIENT_ID,
  });

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    } else if (response?.type === 'error') {
      setIsGoogleLoading(false);
      Alert.alert('Error', 'Google sign-up failed. Please try again.');
    } else if (response?.type === 'dismiss') {
      setIsGoogleLoading(false);
    }
  }, [response]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.phone || !formData.address || !formData.height || !formData.weight) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const memberData = {
        name: formData.name,
        gender: formData.gender,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        clanId: '', // Will be set when joining a clan
        membershipStatus: 'active' as const,
        membershipFee: 600,
        membershipFeeStatus: 'paid' as const,
        membershipStartDate: new Date(),
        membershipEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        lastPaymentDate: new Date().toISOString(),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        }
      };

      await register(formData.email, formData.password, memberData);
      if (Platform.OS === 'web') {
        window.alert('Account created successfully!');
        navigation.navigate('Login');
      } else {
        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      }
    } catch (error: any) {
      console.error('Registration Error:', error);
      let errorMessage = 'An error occurred during registration';
      if (error.message.includes('email-already-in-use')) {
        errorMessage = 'An account with this email already exists';
      } else if (error.message.includes('invalid-email')) {
        errorMessage = 'Invalid email format';
      } else if (error.message.includes('weak-password')) {
        errorMessage = 'Password is too weak';
      }
      
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (idToken: string) => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle(idToken);
    } catch (error: any) {
      let errorMessage = 'Google sign-up failed';
      if (error.message.includes('network-request-failed')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleButtonPress = async () => {
    if (!ENV.GOOGLE.WEB_CLIENT_ID) {
      Alert.alert(
        'Configuration Missing',
        'Google Sign-In is not configured. Please add GOOGLE_WEB_CLIENT_ID to your .env file.'
      );
      return;
    }
    setIsGoogleLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      setIsGoogleLoading(false);
      Alert.alert('Error', 'Failed to start Google sign-up');
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.primaryGradientStart, COLORS.primaryGradientEnd]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          style={Platform.OS === 'web' ? { overflow: 'auto' as any } : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.textWhite} />
            </Pressable>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join your fitness community</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formContainer}>
            {/* Google Sign-Up */}
            <Pressable
              style={({ pressed }) => [
                styles.googleButton,
                (isGoogleLoading || !request) && styles.buttonDisabled,
                pressed && !isGoogleLoading && styles.googleButtonPressed,
              ]}
              onPress={handleGoogleButtonPress}
              disabled={isGoogleLoading || !request}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={COLORS.textPrimary} size="small" />
              ) : (
                <>
                  <View style={styles.googleIconContainer}>
                    <Text style={styles.googleIconG}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>Sign up with Google</Text>
                </>
              )}
            </Pressable>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or register with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Name */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                placeholderTextColor={COLORS.textTertiary}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email *"
                placeholderTextColor={COLORS.textTertiary}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Phone */}
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number *"
                placeholderTextColor={COLORS.textTertiary}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Address */}
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Address *"
                placeholderTextColor={COLORS.textTertiary}
                value={formData.address}
                onChangeText={(value) => handleInputChange('address', value)}
              />
            </View>

            {/* Height & Weight */}
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Ionicons name="resize-outline" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Height (cm) *"
                  placeholderTextColor={COLORS.textTertiary}
                  value={formData.height}
                  onChangeText={(value) => handleInputChange('height', value)}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Ionicons name="scale-outline" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Weight (kg) *"
                  placeholderTextColor={COLORS.textTertiary}
                  value={formData.weight}
                  onChangeText={(value) => handleInputChange('weight', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Gender Selector */}
            <View style={styles.genderContainer}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.genderButtons}>
                {(['male', 'female', 'other'] as const).map((gender) => (
                  <Pressable
                    key={gender}
                    style={({ pressed }) => [
                      styles.genderButton,
                      formData.gender === gender && styles.genderButtonActive,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => handleInputChange('gender', gender)}
                  >
                    <Ionicons
                      name={gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'people'}
                      size={16}
                      color={formData.gender === gender ? COLORS.textWhite : COLORS.textSecondary}
                    />
                    <Text style={[
                      styles.genderButtonText,
                      formData.gender === gender && styles.genderButtonTextActive
                    ]}>
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password *"
                placeholderTextColor={COLORS.textTertiary}
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textTertiary} />
              </Pressable>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password *"
                placeholderTextColor={COLORS.textTertiary}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Invite Code (Optional) */}
            <View style={[styles.inputContainer, styles.inviteContainer]}>
              <Ionicons name="ticket-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Clan Invite Code (optional)"
                placeholderTextColor={COLORS.textTertiary}
                value={formData.inviteCode}
                onChangeText={(value) => handleInputChange('inviteCode', value.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
              />
            </View>
            <Text style={styles.inviteHint}>
              Got an invite code from your gym? Enter it to join their clan.
            </Text>

            {/* Register Button */}
            <Pressable
              style={({ pressed }) => [
                styles.registerButton,
                isLoading && styles.buttonDisabled,
                pressed && !isLoading && styles.buttonPressed,
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.textWhite} size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </Pressable>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Pressable
                onPress={() => navigation.navigate('Login')}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.loginLink}>Sign In</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textWhite,
    marginTop: 10,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 6,
  },
  formContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 24,
    ...SHADOWS.large,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    height: 48,
    backgroundColor: COLORS.surface,
    marginBottom: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  googleButtonPressed: {
    backgroundColor: COLORS.surfaceSecondary,
    transform: [{ scale: 0.98 }],
  },
  googleIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.googleBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  googleIconG: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: 'bold',
  },
  googleButtonText: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  dividerText: {
    marginHorizontal: 12,
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    marginBottom: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surfaceSecondary,
    height: 48,
  },
  inviteContainer: {
    borderColor: COLORS.primaryLight,
    borderStyle: 'dashed',
    backgroundColor: '#F5F3FF',
  },
  inviteHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginBottom: 16,
    marginTop: -4,
    paddingHorizontal: 4,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    height: '100%',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  eyeButton: {
    padding: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  genderContainer: {
    marginBottom: 12,
  },
  fieldLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    backgroundColor: COLORS.surfaceSecondary,
    gap: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  genderButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: COLORS.textWhite,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  registerButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textWhite,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  loginLink: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});

export default RegisterScreen;