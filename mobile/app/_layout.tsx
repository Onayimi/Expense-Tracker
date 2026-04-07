/**
 * Root Layout
 * -----------
 * Wraps the entire app with SQLiteProvider.
 * The database is initialised once here — every screen can then call
 * useSQLiteContext() to get direct DB access.
 */

import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { initDatabase } from '@/src/db/database';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="expenses.db" onInit={initDatabase}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SQLiteProvider>
  );
}
