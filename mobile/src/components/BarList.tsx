// Simple horizontal bar chart: one row per label, bar length = value.
// Labels and numbers are plain text, so the chart is readable as a list too.
import { StyleSheet, Text, View } from 'react-native';

import type { Row } from '@/utils/stats';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

export function BarList({ rows, unit = '' }: { rows: Row[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <View style={styles.list}>
      {rows.map((row) => (
        <View key={row.label} style={styles.row} accessible accessibilityLabel={`${row.label}: ${row.value}${unit}`}>
          <View style={styles.labels}>
            <Text style={styles.label} numberOfLines={1}>
              {row.label}
            </Text>
            <Text style={styles.value}>
              {row.value}
              {unit}
            </Text>
          </View>
          <View style={styles.track}>
            {row.value > 0 ? <View style={[styles.bar, { width: `${(row.value / max) * 100}%` }]} /> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: { gap: 6 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  label: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  value: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.track, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
});
