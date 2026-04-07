/**
 * Settings Screen
 * ---------------
 * Manage funding sources — view existing ones and add new custom ones.
 * The 3 default sources (Personal, House, Loan from Hubby) are shown
 * with a "Default" label. Custom ones can be added here.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '@/src/constants/colors';
import { getAllFundingSources, addFundingSource } from '@/src/db/queries';
import type { FundingSource } from '@/src/types';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const [sources, setSources] = useState<FundingSource[]>([]);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  async function load() {
    const data = await getAllFundingSources(db);
    setSources(data);
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function handleAdd() {
    const name = newName.trim();
    if (!name) {
      Alert.alert('Name required', 'Please enter a name for the funding source.');
      return;
    }
    // Check for duplicates (case-insensitive)
    const exists = sources.some(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      Alert.alert('Already exists', `"${name}" is already in your list.`);
      return;
    }

    setAdding(true);
    try {
      await addFundingSource(db, name);
      setNewName('');
      load();
    } catch {
      Alert.alert('Error', 'Could not add funding source. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={sources}
        keyExtractor={(item) => String(item.id)}

        ListHeaderComponent={
          <>
            {/* Page description */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Funding sources appear in the expense form dropdown. The 3 defaults
                (Personal, House, Loan from Hubby) are always available. Add your
                own custom sources below.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Your Funding Sources</Text>
          </>
        }

        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.rowName}>{item.name}</Text>
              {item.is_default === 1 ? (
                <Text style={styles.defaultTag}>Default</Text>
              ) : null}
            </View>
          </View>
        )}

        ItemSeparatorComponent={() => <View style={styles.divider} />}

        ListFooterComponent={
          <View style={styles.addSection}>
            <Text style={styles.sectionTitle}>Add a New Source</Text>
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. Joint savings"
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />
              <TouchableOpacity
                style={[styles.addBtn, adding && { opacity: 0.6 }]}
                onPress={handleAdd}
                disabled={adding}
              >
                <Text style={styles.addBtnText}>{adding ? '…' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 48 },

  infoBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: colors.primary,
    lineHeight: 20,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  row: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowName: { fontSize: 15, color: colors.text, fontWeight: '500' },
  defaultTag: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: { height: 1, backgroundColor: colors.divider },

  addSection: { marginTop: 28 },
  addRow: { flexDirection: 'row', gap: 10 },
  addInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
