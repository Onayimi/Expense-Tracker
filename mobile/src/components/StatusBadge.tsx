import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Every possible status value and its display config
const BADGE_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  OUTSTANDING:  { label: 'Outstanding', bg: '#FEF6E8', color: '#E9891A' },
  REPAID:       { label: 'Repaid',      bg: '#E9F7EF', color: '#27AE60' },
  OWES_ME:      { label: 'Owes Me',     bg: '#FDECEA', color: '#C0392B' },
  PAID_BACK:    { label: 'Paid Back',   bg: '#E9F7EF', color: '#27AE60' },
  BORROWED:     { label: 'Borrowed',    bg: '#FEF6E8', color: '#E9891A' },
  ME:           { label: 'Me',          bg: '#F3F4F6', color: '#6B7280' },
  HOUSEHOLD:    { label: 'Household',   bg: '#E8F5EE', color: '#2D6A4F' },
  HUBBY:        { label: 'Hubby',       bg: '#FDECEA', color: '#C0392B' },
};

interface Props {
  value: string;
}

export default function StatusBadge({ value }: Props) {
  const config = BADGE_CONFIG[value];
  if (!config) return null;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
