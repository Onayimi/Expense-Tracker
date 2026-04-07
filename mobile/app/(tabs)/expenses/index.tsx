/**
 * Expenses List Screen
 * --------------------
 * Shows all expenses with search and filter controls.
 * Tap any expense to edit it.
 * Use the "+" button to add a new one.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '@/src/constants/colors';
import ExpenseItem from '@/src/components/ExpenseItem';
import EmptyState from '@/src/components/EmptyState';
import { getAllExpenses, getAllFundingSources, markAsRepaid, markAsPaidBack } from '@/src/db/queries';
import { CATEGORIES } from '@/src/types';
import type { Expense, FundingSource } from '@/src/types';

export default function ExpensesScreen() {
  const db = useSQLiteContext();

  // Data
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterFor, setFilterFor] = useState('');
  const [filterFundsType, setFilterFundsType] = useState('');

  async function load() {
    const [exps, sources] = await Promise.all([
      getAllExpenses(db, {
        search: search || undefined,
        category: filterCategory || undefined,
        expenseFor: filterFor || undefined,
        fundsType: filterFundsType || undefined,
      }),
      getAllFundingSources(db),
    ]);
    setExpenses(exps);
    setFundingSources(sources);
  }

  // Reload whenever this screen gains focus
  useFocusEffect(
    useCallback(() => {
      load();
    }, [search, filterCategory, filterFor, filterFundsType])
  );

  async function handleMarkRepaid(id: number) {
    await markAsRepaid(db, id);
    load();
  }

  async function handleMarkPaidBack(id: number) {
    await markAsPaidBack(db, id);
    load();
  }

  function clearFilters() {
    setSearch('');
    setFilterCategory('');
    setFilterFor('');
    setFilterFundsType('');
  }

  const hasFilters = search || filterCategory || filterFor || filterFundsType;

  return (
    <View style={styles.container}>
      {/* ── Search bar ──────────────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search expenses…"
          placeholderTextColor={colors.textMuted}
          clearButtonMode="while-editing"
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(tabs)/expenses/new')}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* ── Filter chips ────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {/* "For" filter */}
        {(['', 'ME', 'HOUSEHOLD', 'HUBBY'] as const).map((val) => (
          <TouchableOpacity
            key={`for-${val}`}
            style={[styles.chip, filterFor === val && styles.chipActive]}
            onPress={() => setFilterFor(val)}
          >
            <Text style={[styles.chipText, filterFor === val && styles.chipTextActive]}>
              {val === '' ? 'All' : val === 'ME' ? 'Me' : val === 'HOUSEHOLD' ? 'Household' : 'Hubby'}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.chipDivider} />

        {/* Funds type filter */}
        {(['', 'MINE', 'BORROWED'] as const).map((val) => (
          <TouchableOpacity
            key={`type-${val}`}
            style={[styles.chip, filterFundsType === val && styles.chipActive]}
            onPress={() => setFilterFundsType(val)}
          >
            <Text style={[styles.chipText, filterFundsType === val && styles.chipTextActive]}>
              {val === '' ? 'Any funds' : val === 'MINE' ? 'My money' : 'Borrowed'}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Clear all */}
        {hasFilters ? (
          <TouchableOpacity style={styles.clearChip} onPress={clearFilters}>
            <Text style={styles.clearChipText}>✕ Clear</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {/* ── Expense count ───────────────────────────────────────────── */}
      <Text style={styles.count}>
        {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
      </Text>

      {/* ── Expense list ────────────────────────────────────────────── */}
      <FlatList
        data={expenses}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ExpenseItem
            expense={item}
            onPress={() => router.push(`/(tabs)/expenses/${item.id}`)}
            onMarkRepaid={
              item.borrowed_status === 'OUTSTANDING'
                ? () => handleMarkRepaid(item.id)
                : undefined
            }
            onMarkPaidBack={
              item.reimbursement_status === 'OWES_ME'
                ? () => handleMarkPaidBack(item.id)
                : undefined
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="🧾"
            title="No expenses yet"
            subtitle="Tap '+ Add' to record your first expense."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  searchRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  filterBar: { maxHeight: 48 },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  chipDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  clearChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  clearChipText: { fontSize: 12, color: colors.danger, fontWeight: '600' },

  count: {
    fontSize: 12,
    color: colors.textMuted,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  list: { padding: 16, paddingTop: 4 },
});
