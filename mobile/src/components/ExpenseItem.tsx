import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors } from '../constants/colors';
import StatusBadge from './StatusBadge';
import { formatCurrency, formatDate } from '../utils/helpers';
import type { Expense } from '../types';

interface Props {
  expense: Expense;
  onPress: () => void;
  onMarkRepaid?: () => void;
  onMarkPaidBack?: () => void;
}

export default function ExpenseItem({
  expense,
  onPress,
  onMarkRepaid,
  onMarkPaidBack,
}: Props) {
  // Show a confirmation before marking repaid
  function confirmMarkRepaid() {
    Alert.alert(
      'Mark as Repaid',
      `Record today as the repayment date for "${expense.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Mark Repaid', onPress: onMarkRepaid },
      ]
    );
  }

  // Show a confirmation before marking paid back
  function confirmMarkPaidBack() {
    Alert.alert(
      'Mark as Paid Back',
      `Record today as the date hubby paid you back for "${expense.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Paid Back', onPress: onMarkPaidBack },
      ]
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Top row: title + amount */}
      <View style={styles.topRow}>
        <View style={styles.titleCol}>
          <Text style={styles.title} numberOfLines={1}>
            {expense.title}
          </Text>
          <Text style={styles.meta}>
            {formatDate(expense.date)} · {expense.funding_source_name}
          </Text>
          <Text style={styles.category}>{expense.category}</Text>
        </View>
        <View style={styles.amountCol}>
          <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
          <StatusBadge value={expense.expense_for} />
        </View>
      </View>

      {/* Status badges row */}
      {(expense.borrowed_status || expense.reimbursement_status) ? (
        <View style={styles.badgeRow}>
          {expense.borrowed_status ? (
            <StatusBadge value={expense.borrowed_status} />
          ) : null}
          {expense.reimbursement_status ? (
            <StatusBadge value={expense.reimbursement_status} />
          ) : null}
        </View>
      ) : null}

      {/* Action buttons — only shown when action is still needed */}
      {(expense.borrowed_status === 'OUTSTANDING' ||
        expense.reimbursement_status === 'OWES_ME') ? (
        <View style={styles.actions}>
          {expense.borrowed_status === 'OUTSTANDING' && onMarkRepaid ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.gold }]}
              onPress={confirmMarkRepaid}
            >
              <Text style={styles.actionBtnText}>✓ Mark Repaid</Text>
            </TouchableOpacity>
          ) : null}
          {expense.reimbursement_status === 'OWES_ME' && onMarkPaidBack ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.success }]}
              onPress={confirmMarkPaidBack}
            >
              <Text style={styles.actionBtnText}>✓ Paid Back</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
    marginRight: 12,
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  category: {
    fontSize: 11,
    color: colors.textMuted,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
