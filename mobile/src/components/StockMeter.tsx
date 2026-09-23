// "180g / 250g remaining" + star score + progress bar + freshness line.
// Turns red when the bag is running low.
import { StyleSheet, Text, View } from 'react-native';

import type { Bean } from '@/api/client';
import { Icon } from './Icon';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { brewsLeft, freshness, isLowStock, roastedAgo, stockPercent } from '@/utils/bean';

export function StockMeter({ bean }: { bean: Bean }) {
  const low = isLowStock(bean);
  const fresh = freshness(bean);
  const roasted = roastedAgo(bean);

  return (
    <View style={[styles.panel, low && styles.panelLow]}>
      <View style={styles.row}>
        <View style={styles.grams}>
          <Icon name="scale" size={14} color={low ? colors.danger : colors.textMuted} />
          <Text style={[styles.amount, low && styles.amountLow]}>{bean.remaining_g}g</Text>
          <Text style={styles.caption}>
            / {bean.bag_weight_g}g left{low ? ` (~${brewsLeft(bean)} brews)` : ''}
          </Text>
        </View>
        {bean.rating !== null ? (
          <View style={styles.grams}>
            <Icon name="star" size={14} color={colors.primary} />
            <Text style={styles.rating}>{bean.rating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${stockPercent(bean)}%`, backgroundColor: low ? colors.danger : colors.accent },
          ]}
        />
      </View>

      {roasted ? (
        <View style={styles.row}>
          <Text style={styles.caption}>{roasted}</Text>
          {fresh ? <Text style={styles.fresh}>{fresh}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceTint },
  panelLow: { backgroundColor: 'rgba(255, 218, 214, 0.35)' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  grams: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  amount: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  amountLow: { color: colors.danger },
  caption: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSubtle, flexShrink: 1 },
  rating: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  fresh: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.primary,
  },
});
