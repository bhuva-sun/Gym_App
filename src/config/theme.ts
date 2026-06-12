// Centralized theme configuration for TheGymEye
// Color palette inspired by the reference design (indigo/purple primary)

export const COLORS = {
  // Primary palette
  primary: '#6C63FF',
  primaryDark: '#5A52D5',
  primaryLight: '#8B85FF',
  primaryGradientStart: '#6C63FF',
  primaryGradientEnd: '#764ba2',

  // Secondary
  secondary: '#7B68EE',
  accent: '#4F46E5',

  // Status colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Membership status
  active: '#10B981',
  expired: '#EF4444',
  pending: '#F59E0B',

  // Backgrounds
  background: '#F8F9FE',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  card: '#FFFFFF',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textWhite: '#FFFFFF',
  textLink: '#6C63FF',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#F0F0F0',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(255, 255, 255, 0.2)',

  // Tab bar
  tabActive: '#6C63FF',
  tabInactive: '#9CA3AF',

  // Google button
  googleRed: '#DB4437',
  googleBlue: '#4285F4',
};

export const GRADIENTS = {
  primary: ['#6C63FF', '#764ba2'] as const,
  dashboard: ['#6C63FF', '#8B5CF6'] as const,
  workout: ['#3B82F6', '#2563EB'] as const,
  profile: ['#8B5CF6', '#7C3AED'] as const,
  diet: ['#10B981', '#059669'] as const,
  fitness: ['#F59E0B', '#D97706'] as const,
  notification: ['#6366F1', '#4F46E5'] as const,
  motivational: ['#6C63FF', '#8B5CF6'] as const,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};
