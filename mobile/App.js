import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';

import DashboardScreen from './src/screens/DashboardScreen';
import SalesScreen from './src/screens/SalesScreen';
import InventoryScreen from './src/screens/InventoryScreen';

const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1d4ed8',
    background: '#f6f7fb',
  },
};

function tabIcon(routeName, focused) {
  const focusedIconMap = {
    Dashboard: 'speedometer',
    Sales: 'cash',
    Inventory: 'cube',
  };
  const outlineIconMap = {
    Dashboard: 'speedometer-outline',
    Sales: 'cash-outline',
    Inventory: 'cube-outline',
  };
  return focused ? focusedIconMap[routeName] : outlineIconMap[routeName];
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="dark" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: '#1d4ed8',
              tabBarInactiveTintColor: '#6b7280',
              tabBarStyle: { backgroundColor: '#fff' },
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons name={tabIcon(route.name, focused)} size={size} color={color} />
              ),
            })}
          >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Sales" component={SalesScreen} />
            <Tab.Screen name="Inventory" component={InventoryScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
