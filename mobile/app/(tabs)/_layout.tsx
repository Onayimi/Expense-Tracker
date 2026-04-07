/**
 * Tab Bar Layout
 * --------------
 * Defines the 5 bottom tabs.
 * The Expenses tab gets its own Stack navigator so Add/Edit screens
 * can be pushed on top of the list screen.
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants/colors';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// Helper so each tab icon can swap between filled (active) and outline (inactive)
function tabIcon(active: IoniconsName, inactive: IoniconsName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={22} color={color} />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          paddingBottom: 4,
          height: 58,
        },
        // Green header used on all tab screens (expenses overrides with its own stack)
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: tabIcon('home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          headerShown: false, // expenses stack manages its own header
          tabBarIcon: tabIcon('list', 'list-outline'),
        }}
      />
      <Tabs.Screen
        name="borrowed"
        options={{
          title: 'Borrowed',
          tabBarIcon: tabIcon('alert-circle', 'alert-circle-outline'),
        }}
      />
      <Tabs.Screen
        name="reimbursements"
        options={{
          title: 'Reimburse',
          tabBarIcon: tabIcon('cash', 'cash-outline'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: tabIcon('settings', 'settings-outline'),
        }}
      />
    </Tabs>
  );
}
