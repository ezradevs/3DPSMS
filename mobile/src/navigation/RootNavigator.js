import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import DashboardScreen from '../screens/DashboardScreen';
import SalesScreen from '../screens/SalesScreen';
import InventoryScreen from '../screens/InventoryScreen';
import InventoryDetailScreen from '../screens/InventoryDetailScreen';
import InventoryFormScreen from '../screens/InventoryFormScreen';
import SaleDetailScreen from '../screens/SaleDetailScreen';
import CustomOrdersScreen from '../screens/CustomOrdersScreen';
import CustomOrderDetailScreen from '../screens/CustomOrderDetailScreen';
import CustomOrderFormScreen from '../screens/CustomOrderFormScreen';
import FilamentScreen from '../screens/FilamentScreen';
import FilamentDetailScreen from '../screens/FilamentDetailScreen';
import FilamentFormScreen from '../screens/FilamentFormScreen';
import OperationsHomeScreen from '../screens/OperationsHomeScreen';
import PrintQueueScreen from '../screens/PrintQueueScreen';
import PrintQueueFormScreen from '../screens/PrintQueueFormScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import ExpensesFormScreen from '../screens/ExpensesFormScreen';
import AdminToolsScreen from '../screens/AdminToolsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
        headerBackTitle: '',
        headerBackTitleStyle: { maxWidth: 0 },
        headerBackTitleAllowFontScaling: false,
        headerBackButtonMenuEnabled: false,
      }}
    >
      <Stack.Screen
        name="DashboardOverview"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function SalesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
        headerBackTitle: '',
        headerBackTitleStyle: { maxWidth: 0 },
        headerBackTitleAllowFontScaling: false,
        headerBackButtonMenuEnabled: false,
      }}
    >
      <Stack.Screen name="SalesHome" component={SalesScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="SaleDetail"
        component={SaleDetailScreen}
        options={{ headerTitle: 'Sale Details' }}
      />
    </Stack.Navigator>
  );
}

function InventoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="InventoryHome"
        component={InventoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InventoryDetail"
        component={InventoryDetailScreen}
        options={{ headerTitle: 'Item Details', headerTitleAlign: 'center', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="InventoryForm"
        component={InventoryFormScreen}
        options={{ headerTitle: 'Item', headerBackTitleVisible: false }}
      />
    </Stack.Navigator>
  );
}

function OperationsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
        headerBackTitle: '',
        headerBackTitleStyle: { maxWidth: 0 },
        headerBackTitleAllowFontScaling: false,
        headerBackButtonMenuEnabled: false,
      }}
    >
      <Stack.Screen
        name="OperationsHome"
        component={OperationsHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrdersHome"
        component={CustomOrdersScreen}
        options={{ headerTitle: 'Custom Orders', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={CustomOrderDetailScreen}
        options={{ headerTitle: 'Order Details', headerTitleAlign: 'center', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="OrderForm"
        component={CustomOrderFormScreen}
        options={{ headerTitle: 'Order', headerTitleAlign: 'center', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="FilamentHome"
        component={FilamentScreen}
        options={{ headerTitle: 'Filament', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="FilamentDetail"
        component={FilamentDetailScreen}
        options={{ headerTitle: 'Spool Details', headerTitleAlign: 'center', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="FilamentForm"
        component={FilamentFormScreen}
        options={{ headerTitle: 'Filament Spool', headerTitleAlign: 'center', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="PrintQueueHome"
        component={PrintQueueScreen}
        options={{ headerTitle: 'Print Queue', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="PrintQueueForm"
        component={PrintQueueFormScreen}
        options={{ headerTitle: 'Print Queue Job', headerTitleAlign: 'center', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="ExpensesHome"
        component={ExpensesScreen}
        options={{ headerTitle: 'Expenses', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="ExpensesForm"
        component={ExpensesFormScreen}
        options={{ headerTitle: 'Expense', headerTitleAlign: 'center', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="AdminHome"
        component={AdminToolsScreen}
        options={{ headerTitle: 'Admin Tools', headerTitleAlign: 'center' }}
      />
    </Stack.Navigator>
  );
}

function iconName(routeName, focused) {
  const icons = {
    Dashboard: focused ? 'speedometer' : 'speedometer-outline',
    Sales: focused ? 'cash' : 'cash-outline',
    Inventory: focused ? 'cube' : 'cube-outline',
    Operations: focused ? 'briefcase' : 'briefcase-outline',
  };
  return icons[routeName] || 'ellipse';
}

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1d4ed8',
        tabBarInactiveTintColor: '#64748b',
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={iconName(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Sales" component={SalesStack} />
      <Tab.Screen name="Inventory" component={InventoryStack} />
      <Tab.Screen name="Operations" component={OperationsStack} />
    </Tab.Navigator>
  );
}
