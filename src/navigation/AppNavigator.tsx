import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { RootStackParamList, MemberTabParamList, AdminTabParamList } from '../types/navigation';
import NotificationBadge from '../components/NotificationBadge';
import { View, Platform } from 'react-native';
import { COLORS } from '../config/theme';

// Auth screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import JoinClanScreen from '../screens/JoinClanScreen';

// Member screens
import DashboardScreen from '../screens/DashboardScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import AddWorkoutScreen from '../screens/AddWorkoutScreen';
import FitnessPlanScreen from '../screens/FitnessPlanScreen';
import DietChartScreen from '../screens/DietChartScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

// Admin screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminWorkoutsScreen from '../screens/admin/AdminWorkoutsScreen';
import AdminFitnessPlansScreen from '../screens/admin/AdminFitnessPlansScreen';
import AdminDietChartsScreen from '../screens/admin/AdminDietChartsScreen';
import AdminEditUserScreen from '../screens/admin/AdminEditUserScreen';
import AdminEditWorkoutScreen from '../screens/admin/AdminEditWorkoutScreen';
import AdminEditFitnessPlanScreen from '../screens/admin/AdminEditFitnessPlanScreen';
import AdminEditDietChartScreen from '../screens/admin/AdminEditDietChartScreen';
import AdminNotificationsScreen from '../screens/admin/AdminNotificationsScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MemberTabParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();

const MemberTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Workouts') {
            iconName = focused ? 'fitness' : 'fitness-outline';
          } else if (route.name === 'Fitness Plan') {
            iconName = focused ? 'flag' : 'flag-outline';
          } else if (route.name === 'Diet Chart') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else {
            iconName = 'help-outline';
          }

          const icon = <Ionicons name={iconName} size={size} color={color} />;

          if (route.name === 'Notifications') {
            return (
              <View style={{ position: 'relative' }}>
                {icon}
                <NotificationBadge size={16} />
              </View>
            );
          }

          return icon;
        },
        tabBarActiveTintColor: COLORS.tabActive,
        tabBarInactiveTintColor: COLORS.tabInactive,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.borderLight,
          paddingBottom: Platform.OS === 'web' ? 8 : undefined,
          height: Platform.OS === 'web' ? 60 : undefined,
          ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Workouts" component={WorkoutsScreen} />
      <Tab.Screen name="Fitness Plan" component={FitnessPlanScreen} />
      <Tab.Screen name="Diet Chart" component={DietChartScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
    </Tab.Navigator>
  );
};

const AdminTabNavigator = () => {
  return (
    <AdminTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Admin Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Users') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Workouts') {
            iconName = focused ? 'fitness' : 'fitness-outline';
          } else if (route.name === 'Fitness Plans') {
            iconName = focused ? 'flag' : 'flag-outline';
          } else if (route.name === 'Diet Charts') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.warning,
        tabBarInactiveTintColor: COLORS.tabInactive,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.borderLight,
          paddingBottom: Platform.OS === 'web' ? 8 : undefined,
          height: Platform.OS === 'web' ? 60 : undefined,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <AdminTab.Screen name="Admin Dashboard" component={AdminDashboardScreen} />
      <AdminTab.Screen name="Users" component={AdminUsersScreen} />
      <AdminTab.Screen name="Workouts" component={AdminWorkoutsScreen} />
      <AdminTab.Screen name="Fitness Plans" component={AdminFitnessPlansScreen} />
      <AdminTab.Screen name="Diet Charts" component={AdminDietChartsScreen} />
      <AdminTab.Screen name="Notifications" component={AdminNotificationsScreen} />
    </AdminTab.Navigator>
  );
};

const AppNavigator = () => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const clan = authContext?.clan;
  const isLoading = authContext?.isLoading;

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Auth screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : !user.clanId ? (
          // User logged in but no clan — show JoinClan
          <Stack.Screen name="JoinClan" component={JoinClanScreen} />
        ) : user.role === 'admin' || user.role === 'owner' ? (
          // Admin/Owner screens
          <>
            <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
            <Stack.Screen name="AdminEditUser" component={AdminEditUserScreen} />
            <Stack.Screen name="AdminEditWorkout" component={AdminEditWorkoutScreen} />
            <Stack.Screen name="AdminEditFitnessPlan" component={AdminEditFitnessPlanScreen} />
            <Stack.Screen name="AdminEditDietChart" component={AdminEditDietChartScreen} />
            <Stack.Screen name="AdminNotifications" component={AdminNotificationsScreen} />
          </>
        ) : (
          // Member screens
          <>
            <Stack.Screen name="MemberTabs" component={MemberTabNavigator} />
            <Stack.Screen name="AddWorkout" component={AddWorkoutScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;