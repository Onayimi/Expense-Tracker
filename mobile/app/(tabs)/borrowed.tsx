/**
 * Borrowed Money Screen
 * ----------------------
 * Shows two sections:
 *  1. Outstanding — expenses paid with borrowed money you haven't repaid yet
 *  2. Repaid — settled borrowed expenses
 *
 * Tap "Mark Repaid" to record repayment. Today's date is saved automatically.
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
import { getAllExpenses, markAsRepaid } from '@/src/db/queries';
import { formatCurrency, formatDate } from '@/src/utils/helpers';
import type { Expense } from '@/src/types';

export default function BorrowedScreen() {
  const db = useSQLiteContext();
  const [outstanding, setOutstanding] = useState<Expense[]>([]);
  const [repaid, setRepaid] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const all = await getAllExpenses(db, { fundsType: 'BORROWED' });
    setOutstanding(all.filter((e) => e.borrowed_status === 'OUTSTANDING'));
    setRepaid(all.filter((e) => e.borrowed_status === 'REPAID'));
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function confirmMarkRepaid(expense: Expense) {
    Alert.alert(
      'Mark as Repaid',
      `Record today as the repayment date for "${expense.title}" (${formatCurrency(expense.amount)})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Mark Repaid',
          onPress: async () => {
            await markAsRepaid(db, expense.id);
            load();
          },
        },
      ]
    );
  }

  const totalOutstanding = outstanding.reduce((s, e) => s + e.amount, 0);
  const totalRepaid = repaid.reduce((s, e) => s + e.amount, 0);

  const sections = [
    { title: 'Outstanding — You Owe', data: outstanding, isOutstanding: true },
    ...(repaid.length > 0
      ? [{ title: 'Repaid — Settled', data: repaid, isOutstanding: false }]
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
          {/* Summary cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { borderLeftColor: colors.gold }]}>
              <Text style={styles.summaryLabel}>Outstanding</Text>
              <Text style={[styles.summaryValue, { color: colors.gold }]}>
                {formatCurrency(totalOutstanding)}
              </Text>
              <Text style={styles.summaryCount}>{outstanding.length} item{outstanding.length !== 1 ? 's' : ''}</Text>
            </View>
            <View style={[styles.summaryCard, { borderLeftColor: colors.success }]}>
              <Text style={styles.summaryLabel}>Repaid</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                {formatCurrency(totalRepaid)}
              </Text>
              <Text style={styles.summaryCount}>{repaid.length} item{repaid.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        </View>
      }

      renderSectionHeader={({ section }) => (
        <Text style={[
          styles.sectionHeader,
          { color: section.isOutstanding ? colors.gold : colors.success },
        ]}>
          {section.title}
        </Text>
      )}

      renderItem={({ item, section }) => (
        <View style={[
          styles.card,
          section.isOutstanding && styles.cardOutstanding,
          !section.isOutstanding && styles.cardRepaid,
        ]}>
          <View style={styles.cardTop}>
            <View style={styles.cardLeft}>
              <Text style={[styles.cardTitle, !section.isOutstanding && styles.cardTitleFaded]}>
                {item.title}
              </Text>
              <Text style={styles.cardMeta}>
                {formatDate(item.date)} · {item.funding_source_name}
              </Text>
              {!section.isOutstanding && item.repaid_date ? (
                <Text style={styles.repaidOn}>Repaid on {formatDate(item.repaid_date)}</Text>
              ) : null}
            </View>
            <View style={styles.cardRight}>
              <Text style={[
                styles.cardAmount,
                { color: section.isOutstanding ? colors.gold : colors.textMuted },
              ]}>
                {formatCurrency(item.amount)}
              </Text>
              <StatusBadge value={item.borrowed_status ?? ''} />
            </View>
          </View>
          {section.isOutstanding ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => confirmMarkRepaid(item)}
            >
              <Text style={styles.actionBtnText}>✓ Mark Repaid</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      ListEmptyComponent={
        <EmptyState
          icon="💸"
          title="No borrowed expenses"
          subtitle="Expenses paid with borrowed money will appear here."
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
  cardOutstanding: { borderLeftWidth: 3, borderLeftColor: colors.gold },
  cardRepaid: { opacity: 0.75 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLeft: { flex: 1, marginRight: 12 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  cardTitleFaded: { textDecorationLine: 'line-through', color: colors.textSecondary },
  cardMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  repaidOn: { fontSize: 11, color: colors.success, marginTop: 4, fontWeight: '600' },
  cardAmount: { fontSize: 16, fontWeight: '700' },
  actionBtn: {
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
