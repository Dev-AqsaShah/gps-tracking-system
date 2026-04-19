// tasks/locationTask must be imported first so TaskManager.defineTask runs before anything else
import './tasks/locationTask';
import { LOCATION_TASK_NAME, officeList } from './tasks/locationTask';

import React, { useEffect, useState } from 'react';
import { Alert, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Location from 'expo-location';
import axios from 'axios';

import { BACKEND_BASE_URL } from './config';
import { AuthProvider, useAuth } from './context/AuthContext';
import { colors } from './theme';

import AttendanceScreen from './screens/AttendanceScreen';
import VisitList from './screens/VisitList';
import DayClose from './screens/DayClose';
import CustomerDetail from './screens/CustomerDetail';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 6,
          height: 62,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
      }}
    >
      <Tab.Screen name="Attendance" component={AttendanceScreen} options={{ tabBarLabel: 'Attendance' }} />
      <Tab.Screen name="VisitList" component={VisitList} options={{ tabBarLabel: 'My Visits' }} />
      <Tab.Screen name="DayClose" component={DayClose} options={{ tabBarLabel: 'Close Day' }} />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) return <AuthNavigator />;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgCard },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="CustomerDetail"
        component={CustomerDetail}
        options={({ route }: any) => ({ title: route.params?.customer?.name ?? 'Visit' })}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [gpsReady, setGpsReady] = useState(false);

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    try {
      const res = await axios.get(`${BACKEND_BASE_URL}/api/office`);
      const list = res.data?.offices ?? [];
      officeList.splice(0, officeList.length, ...list);
    } catch {
      console.warn('Could not load office list for geofencing.');
    }

    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    const { status: bg } = await Location.requestBackgroundPermissionsAsync();

    if (fg !== 'granted' || bg !== 'granted') {
      Alert.alert('Location Permission Required', 'Please grant foreground and background location access for GPS tracking.');
    } else {
      try {
        const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (!running) {
          await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 20,
            deferredUpdatesInterval: 60000,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
              notificationTitle: 'GPS Tracking Active',
              notificationBody: 'Your location is being tracked.',
              notificationColor: colors.primary,
            },
          });
        }
      } catch (e: any) {
        console.warn('GPS start failed:', e.message);
      }
    }

    setGpsReady(true);
  };

  if (!gpsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
