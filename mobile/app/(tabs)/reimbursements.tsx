/**
 * Reimbursements Screen
 * ----------------------
 * Shows two sections:
 *  1. Owes Me — expenses for hubby that he hasn't paid back yet
 *  2. Paid Back — settled reimbursements
 *
 * Tap "Paid Back" to record the settlement. Today's date is saved automatically.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '@/src/constants/colors';
import StatusBadge from '@/src/components/StatusBadge';
import EmptyState from '@/src/components/EmptyState';
import { getAllExpenses, markAsPaidBack } from '@/src/db/queries';
import { formatCurrency, formatDate } from '@/src/utils/helpers';
import type { Expense } from '@/src/types';

export default function ReimbursementsScreen() {
  const db = useSQLiteContext();
  const [owesMe, setOwesMe] = useState<Expense[]>([]);
  const [paidBack, setPaidBack] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const all = await getAllExpenses(db, { expenseFor: 'HUBBY' });
    setOwesMe(all.filter((e) => e.reimbursement_status === 'OWES_ME'));
    setPaidBack(all.filter((e) => e.reimbursement_status === 'PAID_BACK'));
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function confirmMarkPaidBack(expense: Expense) {
    Alert.alert(
      'Mark as Paid Back',
      `Record today as the date hubby paid you back for "${expense.title}" (${formatCurrency(expense.amount)})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Paid Back',
          onPress: async () => {
            await markAsPaidBack(db, expense.id);
            load();
          },
        },
      ]
    );
  }

  const totalOwesMe = owesMe.reduce((s, e) => s + e.amount, 0);
  const totalPaidBack = paidBack.reduce((s, e) => s + e.amount, 0);

  const sections = [
    { title: 'Hubby Owes Me', data: owesMe, isOwed: true },
    ...(paidBack.length > 0
      ? [{ title: 'Paid Back — Settled', data: paidBack, isOwed: false }]
      : []),
  ];

  return (
    <SectionList
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      stickySectionHeadersEnabled={false}

      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { borderLeftColor: colors.danger }]}>
              <Text style={styles.summaryLabel}>Owes Me</Text>
              <Text style={[styles.summaryValue, { color: colors.danger }]}>
                {formatCurrency(totalOwesMe)}
              </Text>
              <Text style={styles.summaryCount}>{owesMe.length} pending</Text>
            </View>
            <View style={[styles.summaryCard, { borderLeftColor: colors.success }]}>
              <Text style={styles.summaryLabel}>Received Back</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                {formatCurrency(totalPaidBack)}
              </Text>
              <Text style={styles.summaryCount}>{paidBack.length} settled</Text>
            </View>
          </View>
        </View>
      }

      renderSectionHeader={({ section }) => (
        <Text style={[
          styles.sectionHeader,
          { color: section.isOwed ? colors.danger : colors.success },
        ]}>
          {section.title}
        </Text>
      )}

      renderItem={({ item, section }) => (
        <View style={[
          styles.card,
          section.isOwed && styles.cardOwed,
          !section.isOwed && styles.cardSettled,
        ]}>
          <View style={styles.cardTop}>
            <View style={styles.cardLeft}>
              <Text style={[styles.cardTitle, !section.isOwed && styles.cardTitleFaded]}>
                {item.title}
              </Text>
              <Text style={styles.cardMeta}>
                {formatDate(item.date)} · {item.funding_source_name}
              </Text>
              {!section.isOwed && item.reimbursement_date ? (
                <Text style={styles.paidOn}>Paid back on {formatDate(item.reimbursement_date)}</Text>
              ) : null}
            </View>
            <View style={styles.cardRight}>
              <Text style={[
                styles.cardAmount,
                { color: section.isOwed ? colors.danger : colors.textMuted },
              ]}>
                {formatCurrency(item.amount)}
              </Text>
              <StatusBadge value={item.reimbursement_status ?? ''} />
            </View>
          </View>
          {section.isOwed ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => confirmMarkPaidBack(item)}
            >
              <Text style={styles.actionBtnText}>✓ Paid Back</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      ListEmptyComponent={
        <EmptyState
          icon="🤝"
          title="No hubby expenses"
          subtitle='Expenses marked as "For Hubby" will appear here.'
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 32 },
  header: { padding: 16, paddingBottom: 0 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  summaryCount: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardOwed: { borderLeftWidth: 3, borderLeftColor: colors.danger },
  cardSettled: { opacity: 0.75 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLeft: { flex: 1, marginRight: 12 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  cardTitleFaded: { textDecorationLine: 'line-through', color: colors.textSecondary },
  cardMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  paidOn: { fontSize: 11, color: colors.success, marginTop: 4, fontWeight: '600' },
  cardAmount: { fontSize: 16, fontWeight: '700' },
  actionBtn: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
