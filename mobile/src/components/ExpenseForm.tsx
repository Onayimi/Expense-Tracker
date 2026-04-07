/**
 * ExpenseForm
 * -----------
 * Shared form used by both the Add and Edit expense screens.
 * Handles the date picker, category modal, and all field state.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../constants/colors';
import { CATEGORIES, type FundsType, type ExpenseFor, type FundingSource } from '../types';
import type { ExpenseFormValues } from '../types';
import { todayString, toDateString, formatDate, parseDate } from '../utils/helpers';

interface Props {
  /** Pre-filled values when editing. Leave undefined for a blank new-expense form. */
  initialValues?: Partial<ExpenseFormValues>;
  fundingSources: FundingSource[];
  /** Called with validated form values on submit */
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
  submitLabel: string;
}

export default function ExpenseForm({
  initialValues,
  fundingSources,
  onSubmit,
  submitLabel,
}: Props) {
  // ── Form field state ────────────────────────────────────────────────────
  const [date, setDate] = useState(initialValues?.date ?? todayString());
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [category, setCategory] = useState(initialValues?.category ?? '');
  const [amount, setAmount] = useState(initialValues?.amount ?? '');
  const [fundingSourceId, setFundingSourceId] = useState<number>(
    initialValues?.funding_source_id ?? 0
  );
  const [fundsType, setFundsType] = useState<FundsType>(
    initialValues?.funds_type ?? 'MINE'
  );
  const [expenseFor, setExpenseFor] = useState<ExpenseFor>(
    initialValues?.expense_for ?? 'ME'
  );
  const [notes, setNotes] = useState(initialValues?.notes ?? '');

  // ── UI state ────────────────────────────────────────────────────────────
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Set first funding source as default once sources load
  useEffect(() => {
    if (!initialValues?.funding_source_id && fundingSources.length > 0) {
      setFundingSourceId(fundingSources[0].id);
    }
  }, [fundingSources]);

  // ── Submit handler ──────────────────────────────────────────────────────
  async function handleSubmit() {
    setError(null);

    if (!title.trim()) { setError('Title is required'); return; }
    if (!date)         { setError('Date is required'); return; }
    if (!category)     { setError('Please select a category'); return; }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid amount greater than 0');
      return;
    }
    if (!fundingSourceId) { setError('Please select a funding source'); return; }

    setSubmitting(true);
    try {
      await onSubmit({ date, title, category, amount, funding_source_id: fundingSourceId, funds_type: fundsType, expense_for: expenseFor, notes });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Error banner */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* ── Date ─────────────────────────────────────────────────────── */}
      <View style={styles.field}>
        <Text style={styles.label}>Date *</Text>

        {Platform.OS === 'ios' ? (
          // iOS: compact picker sits inline — taps to open a floating calendar
          <View style={styles.iosDateRow}>
            <Text style={styles.fieldHint}>Tap the date to change it  </Text>
            <DateTimePicker
              value={parseDate(date)}
              mode="date"
              display="compact"
              onChange={(_, selected) => {
                if (selected) setDate(toDateString(selected));
              }}
            />
          </View>
        ) : (
          // Android: button opens a calendar dialog
          <>
            <TouchableOpacity
              style={styles.inputButton}
              onPress={() => setShowAndroidDatePicker(true)}
            >
              <Text style={styles.inputButtonText}>📅  {formatDate(date)}</Text>
            </TouchableOpacity>
            {showAndroidDatePicker && (
              <DateTimePicker
                value={parseDate(date)}
                mode="date"
                display="default"
                onChange={(_, selected) => {
                  setShowAndroidDatePicker(false);
                  if (selected) setDate(toDateString(selected));
                }}
              />
            )}
          </>
        )}
      </View>

      {/* ── Title ────────────────────────────────────────────────────── */}
      <View style={styles.field}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Weekly groceries"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* ── Category ─────────────────────────────────────────────────── */}
      <View style={styles.field}>
        <Text style={styles.label}>Category *</Text>
        <TouchableOpacity
          style={styles.inputButton}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={category ? styles.inputButtonText : styles.placeholder}>
            {category || 'Select category…'}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* ── Amount ───────────────────────────────────────────────────── */}
      <View style={styles.field}>
        <Text style={styles.label}>Amount (£) *</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
        />
      </View>

      {/* ── Funding Source ───────────────────────────────────────────── */}
      <View style={styles.field}>
        <Text style={styles.label}>Source of Funds *</Text>
        <View style={styles.chipRow}>
          {fundingSources.map((src) => (
            <TouchableOpacity
              key={src.id}
              style={[
                styles.chip,
                fundingSourceId === src.id && styles.chipActive,
              ]}
              onPress={() => setFundingSourceId(src.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  fundingSourceId === src.id && styles.chipTextActive,
                ]}
              >
                {src.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Funds Type ───────────────────────────────────────────────── */}
      <View style={styles.field}>
        <Text style={styles.label}>Funds Type *</Text>
        <View style={styles.twoCol}>
          <TouchableOpacity
            style={[styles.optionCard, fundsType === 'MINE' && styles.optionCardGreen]}
            onPress={() => setFundsType('MINE')}
          >
            <Text style={[styles.optionTitle, fundsType === 'MINE' && { color: colors.primary }]}>
              My own money
            </Text>
            <Text style={styles.optionSub}>Paying from your funds</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionCard, fundsType === 'BORROWED' && styles.optionCardGold]}
            onPress={() => setFundsType('BORROWED')}
          >
            <Text style={[styles.optionTitle, fundsType === 'BORROWED' && { color: colors.gold }]}>
              Borrowed money
            </Text>
            <Text style={styles.optionSub}>Tracked as outstanding</Text>
          </TouchableOpacity>
        </View>
        {fundsType === 'BORROWED' ? (
          <View style={[styles.infoBox, { backgroundColor: colors.goldLight }]}>
            <Text style={[styles.infoText, { color: colors.gold }]}>
              ⚠️  This will be marked as <Text style={{ fontWeight: '700' }}>Outstanding</Text> until you mark it as repaid.
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Expense For ──────────────────────────────────────────────── */}
      <View style={styles.field}>
        <Text style={styles.label}>This expense is for *</Text>
        <View style={styles.threeCol}>
          {(
            [
              { value: 'ME', label: 'Me', sub: 'Personal' },
              { value: 'HOUSEHOLD', label: 'Household', sub: 'Shared' },
              { value: 'HUBBY', label: 'Hubby', sub: 'He owes me' },
            ] as const
          ).map((opt) => {
            const isActive = expenseFor === opt.value;
            const isHubby = opt.value === 'HUBBY';
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.optionCard,
                  isActive && (isHubby ? styles.optionCardRed : styles.optionCardGreen),
                ]}
                onPress={() => setExpenseFor(opt.value)}
              >
                <Text
                  style={[
                    styles.optionTitle,
                    isActive && { color: isHubby ? colors.danger : colors.primary },
                  ]}
                >
                  {opt.label}
                </Text>
                <Text style={styles.optionSub}>{opt.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {expenseFor === 'HUBBY' ? (
          <View style={[styles.infoBox, { backgroundColor: colors.dangerLight }]}>
            <Text style={[styles.infoText, { color: colors.danger }]}>
              💸  Hubby will owe you this until he pays you back.
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Notes ────────────────────────────────────────────────────── */}
      <View style={styles.field}>
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any extra details…"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* ── Submit ───────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitBtnText}>
          {submitting ? 'Saving…' : submitLabel}
        </Text>
      </TouchableOpacity>

      {/* ── Category picker modal ─────────────────────────────────────── */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Category</Text>
          <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
            <Text style={styles.modalDone}>Done</Text>
          </TouchableOpacity>
        </View>
        <ScrollView>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.modalRow,
                category === cat && styles.modalRowActive,
              ]}
              onPress={() => {
                setCategory(cat);
                setShowCategoryModal(false);
              }}
            >
              <Text
                style={[
                  styles.modalRowText,
                  category === cat && styles.modalRowTextActive,
                ]}
              >
                {cat}
              </Text>
              {category === cat ? (
                <Text style={{ color: colors.primary }}>✓</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 48 },

  errorBox: {
    backgroundColor: colors.dangerLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600' },

  field: { marginBottom: 22 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },

  // Generic text input
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },

  // Button-style input (date, category)
  inputButton: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputButtonText: { fontSize: 15, color: colors.text },
  placeholder: { fontSize: 15, color: colors.textMuted },
  chevron: { fontSize: 18, color: colors.textMuted },

  // iOS date row
  iosDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  fieldHint: { fontSize: 13, color: colors.textSecondary },

  // Funding source chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: colors.primary, fontWeight: '700' },

  // Option cards (funds type, expense for)
  twoCol: { flexDirection: 'row', gap: 10 },
  threeCol: { flexDirection: 'row', gap: 8 },
  optionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 12,
  },
  optionCardGreen: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionCardGold: {
    borderColor: colors.gold,
    backgroundColor: colors.goldLight,
  },
  optionCardRed: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  optionSub: { fontSize: 11, color: colors.textMuted },

  // Info callout boxes
  infoBox: {
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  infoText: { fontSize: 13, lineHeight: 18 },

  // Submit button
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Category modal
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  modalDone: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalRowActive: { backgroundColor: colors.primaryLight },
  modalRowText: { fontSize: 15, color: colors.text },
  modalRowTextActive: { color: colors.primary, fontWeight: '600' },
});
