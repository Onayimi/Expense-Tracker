/**
 * Edit Expense Screen
 * -------------------
 * Loads the existing expense by ID, pre-fills the form, and saves
 * changes on submit. Also has a Delete button in the header.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '@/src/constants/colors';
import ExpenseForm from '@/src/components/ExpenseForm';
import { getExpenseById, updateExpense, deleteExpense, getAllFundingSources } from '@/src/db/queries';
import type { Expense, FundingSource } from '@/src/types';

export default function EditExpenseScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [exp, sources] = await Promise.all([
        getExpenseById(db, Number(id)),
        getAllFundingSources(db),
      ]);
      setExpense(exp);
      setFundingSources(sources);
      setLoading(false);
    }
    load();
  }, [id]);

  // Add a Delete button to the header once the expense is loaded
  useEffect(() => {
    if (!expense) return;
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={confirmDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      ),
    });
  }, [expense]);

  function confirmDelete() {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense?.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteExpense(db, Number(id));
            router.back();
          },
        },
      ]
    );
  }

  async function handleSubmit(values: import('@/src/types').ExpenseFormValues) {
    await updateExpense(db, Number(id), {
      date: values.date,
      title: values.title,
      category: values.category,
      amount: parseFloat(values.amount),
      funding_source_id: values.funding_source_id,
      funds_type: values.funds_type,
      expense_for: values.expense_for,
      notes: values.notes,
    });
    router.back();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textSecondary }}>Expense not found.</Text>
      </View>
    );
  }

  return (
    <ExpenseForm
      fundingSources={fundingSources}
      initialValues={{
        date: expense.date,
        title: expense.title,
        category: expense.category,
        amount: String(expense.amount),
        funding_source_id: expense.funding_source_id,
        funds_type: expense.funds_type,
        expense_for: expense.expense_for,
        notes: expense.notes ?? '',
      }}
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { marginRight: 4, paddingHorizontal: 8, paddingVertical: 4 },
  deleteBtnText: { color: '#ffcccc', fontSize: 15, fontWeight: '600' },
});
