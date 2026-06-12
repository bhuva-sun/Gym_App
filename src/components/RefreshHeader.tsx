import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, RADIUS, TYPOGRAPHY } from '../config/theme';

interface RefreshHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  showBackButton?: boolean;
  gradientColors?: readonly [string, string, ...string[]];
  showRefreshButton?: boolean;
}

const RefreshHeader: React.FC<RefreshHeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  showBackButton = false,
  gradientColors = [COLORS.primaryGradientStart, COLORS.primaryGradientEnd],
  showRefreshButton = true,
}) => {
  const navigation = useNavigation();

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.header}
    >
      <View style={styles.headerTop}>
        {showBackButton && (
          <Pressable 
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.textWhite} />
          </Pressable>
        )}
        <Text style={styles.headerTitle}>{title}</Text>
        {showRefreshButton && onRefresh && (
          <Pressable 
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={22} color={COLORS.textWhite} />
          </Pressable>
        )}
      </View>
      
      {subtitle && (
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textWhite,
    flex: 1,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});

export default RefreshHeader;