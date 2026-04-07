/**
 * Expenses Stack Layout
 * ----------------------
 * A stack navigator inside the Expenses tab.
 * - index  → All Expenses list
 * - new    → Add Expense (pushed on top)
 * - [id]   → Edit Expense (pushed on top)
 */

import { Stack } from 'expo-router';
import { colors } from '@/src/constants/colors';

export default function ExpensesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'All Expenses' }} />
      <Stack.Screen name="new"   options={{ title: 'Add Expense' }} />
      <Stack.Screen name="[id]"  options={{ title: 'Edit Expense' }} />
    </Stack>
  );
}
