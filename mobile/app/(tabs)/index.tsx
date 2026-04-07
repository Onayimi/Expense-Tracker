/**
 * Dashboard Screen
 * ----------------
 * Shows summary stat cards, spending breakdowns, and the two
 * "needs action" sections at the bottom:
 *  - Unpaid borrowed funds
 *  - Hubby owes me
 *
 * Pull to refresh, and also auto-refreshes whenever the tab gains focus.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '@/src/constants/colors';
import SummaryCard from '@/src/components/SummaryCard';
import { getDashboardSummary } from '@/src/db/queries';
import { formatCurrency, formatDate } from '@/src/utils/helpers';
import type { DashboardSummary } from '@/src/types';

export default function DashboardScreen() {
  const db = useSQLiteContext();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const summary = await getDashboardSummary(db);
    setData(summary);
  }

  // Reload every time this tab comes into focus (e.g. after adding an expense)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (!data) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Page title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSub}>Your expense overview</Text>
      </View>

      {/* ── Main stat cards ─────────────────────────────────────────── */}
      <SummaryCard
        title="Total Spent"
        value={formatCurrency(data.totalAmount)}
        subtitle={`${data.totalExpenses} transaction${data.totalExpenses !== 1 ? 's' : ''}`}
        accentColor={colors.primary}
        icon="💰"
      />
      <SummaryCard
        title="Outstanding Borrowed"
        value={formatCurrency(data.totalOutstandingBorrowed)}
        subtitle="Money you still owe"
        accentColor={colors.gold}
        icon="⚠️"
      />
      <SummaryCard
        title="Hubby Owes Me"
        value={formatCurrency(data.totalHubbyOwesMe)}
        subtitle="Pending reimbursements"
        accentColor={colors.danger}
        icon="💸"
      />
      <SummaryCard
        title="All Settled"
        value={formatCurrency(
          data.totalRepaidBorrowed + data.totalReimbursementsReceived
        )}
        subtitle="Repaid + received back"
        accentColor={colors.success}
        icon="✅"
      />

      {/* ── By category ─────────────────────────────────────────────── */}
      {data.byCategory.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          {data.byCategory.map(({ category, total }) => (
            <View key={category} style={styles.row}>
              <Text style={styles.rowLabel}>{category}</Text>
              <Text style={styles.rowValue}>{formatCurrency(total)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* ── By funding source ───────────────────────────────────────── */}
      {data.bySource.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Source</Text>
          {data.bySource.map(({ name, total }) => (
            <View key={name} style={styles.row}>
              <Text style={styles.rowLabel}>{name}</Text>
              <Text style={styles.rowValue}>{formatCurrency(total)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Outstanding borrowed ─────────────────────────────────────── */}
      <View style={[styles.section, { borderTopColor: colors.gold, borderTopWidth: 3 }]}>
        <Text style={[styles.sectionTitle, { color: colors.gold }]}>
          Unpaid Borrowed Funds
        </Text>
        {data.outstandingBorrowed.length === 0 ? (
          <Text style={styles.emptyNote}>🎉  No outstanding borrowed money!</Text>
        ) : (
          <>
            {data.outstandingBorrowed.map((e) => (
              <View key={e.id} style={styles.debtRow}>
                <View>
                  <Text style={styles.debtTitle}>{e.title}</Text>
                  <Text style={styles.debtMeta}>{formatDate(e.date)}</Text>
                </View>
                <Text style={[styles.debtAmount, { color: colors.gold }]}>
                  {formatCurrency(e.amount)}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total outstanding</Text>
              <Text style={[styles.totalValue, { color: colors.gold }]}>
                {formatCurrency(data.totalOutstandingBorrowed)}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* ── Hubby owes me ────────────────────────────────────────────── */}
      <View style={[styles.section, { borderTopColor: colors.danger, borderTopWidth: 3 }]}>
        <Text style={[styles.sectionTitle, { color: colors.danger }]}>
          Hubby Owes Me
        </Text>
        {data.hubbyOwesMe.length === 0 ? (
          <Text style={styles.emptyNote}>🎉  Hubby is all settled up!</Text>
        ) : (
          <>
            {data.hubbyOwesMe.map((e) => (
              <View key={e.id} style={styles.debtRow}>
                <View>
                  <Text style={styles.debtTitle}>{e.title}</Text>
                  <Text style={styles.debtMeta}>{formatDate(e.date)}</Text>
                </View>
                <Text style={[styles.debtAmount, { color: colors.danger }]}>
                  {formatCurrency(e.amount)}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total owed by hubby</Text>
              <Text style={[styles.totalValue, { color: colors.danger }]}>
                {formatCurrency(data.totalHubbyOwesMe)}
              </Text>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textSecondary, fontSize: 15 },

  header: { marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },

  section: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowLabel: { fontSize: 14, color: colors.text },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.text },

  debtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  debtTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  debtMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  debtAmount: { fontSize: 15, fontWeight: '700' },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 17, fontWeight: '800' },

  emptyNote: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
