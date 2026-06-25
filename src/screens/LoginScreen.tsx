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

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();

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
      Alert.alert('Error', 'Google sign-in failed. Please try again.');
    } else if (response?.type === 'dismiss') {
      setIsGoogleLoading(false);
    }
  }, [response]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      let errorMessage = 'An error occurred during login';
      if (error.message.includes('user-not-found')) {
        errorMessage = 'No account found with this email';
      } else if (error.message.includes('wrong-password')) {
        errorMessage = 'Invalid password';
      } else if (error.message.includes('invalid-email')) {
        errorMessage = 'Invalid email format';
      } else if (error.message.includes('invalid-credential')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message.includes('too-many-requests')) {
        errorMessage = 'Too many failed attempts. Please try again later';
      }
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (idToken: string) => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle(idToken);
    } catch (error: any) {
      let errorMessage = 'Google sign-in failed';
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
      Alert.alert('Error', 'Failed to start Google sign-in');
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
          {/* Logo & Title */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="fitness" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>TheGymEye</Text>
            <Text style={styles.subtitle}>Your Fitness Journey Starts Here</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={COLORS.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textTertiary}
                />
              </Pressable>
            </View>

            {/* Login Button */}
            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                isLoading && styles.buttonDisabled,
                pressed && !isLoading && styles.buttonPressed,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.textWhite} size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </Pressable>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In Button */}
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
                  <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </>
              )}
            </Pressable>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <Pressable
                onPress={() => navigation.navigate('Register')}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.registerLink}>Sign Up</Text>
              </Pressable>
            </View>
          </View>

          {/* Demo Info */}
          <View style={styles.demoContainer}>
            <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.demoText}>
              Demo: john@example.com / password123
            </Text>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.textWhite,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
    marginBottom: 16,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textWhite,
    fontSize: 32,
    letterSpacing: -1,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 6,
  },
  formContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 28,
    ...SHADOWS.large,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surfaceSecondary,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    height: '100%',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  eyeButton: {
    padding: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  loginButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textWhite,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.textTertiary,
    ...TYPOGRAPHY.caption,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    height: 52,
    backgroundColor: COLORS.surface,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  googleButtonPressed: {
    backgroundColor: COLORS.surfaceSecondary,
    transform: [{ scale: 0.98 }],
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.googleBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIconG: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: 'bold',
  },
  googleButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  registerLink: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  demoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  demoText: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default LoginScreen;