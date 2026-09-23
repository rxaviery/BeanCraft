// One brew in a list. Tapping it opens the brew for editing.
import { StyleSheet, Text, View } from 'react-native';

import type { Brew } from '@/api/client';
import { Card } from './Card';
import { Icon } from './Icon';
import { colors, fonts, radius, spacing, type } from '@/theme/tokens';
import { brewSummary, formatBrewedAt, methodIcon } from '@/utils/brew';

type Props = {
  brew: Brew;
  onPress: () => void;
  showBean?: boolean; // hide the bean name when the list is already for one bean
};

export function BrewCard({ brew, onPress, showBean = true }: Props) {
  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Icon name={methodIcon(brew.method)} size={22} color={colors.primary} />
        </View>
        <View style={styles.text}>
          <View style={styles.titleRow}>
            <Text style={type.cardTitle} numberOfLines={1}>
              {showBean ? brew.bean_name : brew.method}
            </Text>
            {brew.rating !== null ? (
              <View style={styles.rating}>
                <Icon name="star" size={13} color={colors.primary} />
                <Text style={styles.ratingText}>{brew.rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>
          <Text style={type.bodyMedium} numberOfLines={1}>
            {showBean ? `${brew.method} • ` : ''}
            {brewSummary(brew)}
          </Text>
          <Text style={type.caption}>{formatBrewedAt(brew.brewed_at)}</Text>
        </View>
      </View>
      {brew.notes ? (
        <Text style={styles.notes} numberOfLines={2}>
          {brew.notes}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  text: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
  notes: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTint,
  },
});
