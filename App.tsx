import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { HabitProvider } from './src/context/HabitContext';
import { TodayScreen } from './src/screens/TodayScreen';
import { HabitDetailScreen } from './src/screens/HabitDetailScreen';
import { CreateHabitScreen } from './src/screens/CreateHabitScreen';
import { ProgressOverviewScreen } from './src/screens/ProgressOverviewScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { HabitsListScreen } from './src/screens/HabitsListScreen';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import { useHabits } from './src/context/HabitContext';
import { THEME_BG } from './src/theme';
import type { RootStackParamList, TabParamList } from './src/navigation/types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const baseTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0D1117',
    card: '#161D26',
    text: '#F0F6FC',
    border: '#26303D',
    primary: '#10B981',
  },
};

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121820',
          borderTopColor: '#262E38',
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#34D399',
        tabBarInactiveTintColor: '#8B949E',
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse';
          if (route.name === 'Today') iconName = 'sunny-outline';
          else if (route.name === 'Schedule') iconName = 'time-outline';
          else if (route.name === 'Progress') iconName = 'stats-chart-outline';
          else if (route.name === 'Habits') iconName = 'list-outline';
          else if (route.name === 'Settings') iconName = 'settings-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Progress" component={ProgressOverviewScreen} />
      <Tab.Screen name="Habits" component={HabitsListScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  const { profile, ready, status, error, reload } = useHabits();
  if (!ready) return null; // wait for the saved profile so the theme doesn't flash

  if (status !== 'ready') {
    return (
      <View style={{ flex: 1, backgroundColor: THEME_BG[profile.themeVariant], alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <StatusBar style="light" />
        {status === 'loading' ? (
          <>
            <ActivityIndicator size="large" color="#34D399" />
            <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', marginTop: 14 }}>
              Connecting to the server… the first load can take a minute if it was idle.
            </Text>
          </>
        ) : (
          <>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Can't load your habits</Text>
            <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginBottom: 18 }}>{error}</Text>
            <TouchableOpacity
              onPress={reload}
              style={{ backgroundColor: '#2D6857', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  const theme = {
    ...baseTheme,
    colors: { ...baseTheme.colors, background: THEME_BG[profile.themeVariant] },
  };

  return (
    <NavigationContainer theme={theme}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={BottomTabs} />
        <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
        <Stack.Screen
          name="CreateHabit"
          component={CreateHabitScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <HabitProvider>
      <Root />
    </HabitProvider>
  );
}
