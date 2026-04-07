import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  accentColor?: string;
  icon?: string;
}

export default function SummaryCard({
  title,
  value,
  subtitle,
  accentColor = colors.primary,
  icon,
}: Props) {
  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      <View style={styles.row}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <View style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: { fontSize: 26 },
  text: { flex: 1 },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
