/**
 * Add Expense Screen
 * ------------------
 * Renders a blank ExpenseForm. On submit, creates the expense
 * in SQLite (with auto-status logic) then goes back to the list.
 */

import React, { useState, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';
import ExpenseForm from '@/src/components/ExpenseForm';
import { createExpense, getAllFundingSources } from '@/src/db/queries';
import type { FundingSource, ExpenseFormValues } from '@/src/types';

export default function NewExpenseScreen() {
  const db = useSQLiteContext();
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);

  useEffect(() => {
    getAllFundingSources(db).then(setFundingSources);
  }, []);

  async function handleSubmit(values: ExpenseFormValues) {
    await createExpense(db, {
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

  return (
    <ExpenseForm
      fundingSources={fundingSources}
      onSubmit={handleSubmit}
      submitLabel="Add Expense"
    />
  );
}
