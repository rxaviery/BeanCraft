// One bean in the stash list. Tapping the card opens details; the ⋮ button
// opens the Edit / Delete menu. The ⋮ button sits beside the card (not
// inside it) so the two tap areas never overlap.
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Bean } from '@/api/client';
import { Card } from './Card';
import { Chip } from './Chip';
import { Icon } from './Icon';
import { StockMeter } from './StockMeter';
import { Tag } from './Tag';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { isLowStock, notesToList, roastAndProcess } from '@/utils/bean';

type Props = {
  bean: Bean;
  onPress: () => void;
  onMenu: () => void;
};

export function BeanCard({ bean, onPress, onMenu }: Props) {
  const label = roastAndProcess(bean);
  const notes = notesToList(bean.tasting_notes).slice(0, 3);
  const place = [bean.roaster, bean.origin].filter(Boolean).join(' • ');

  return (
    <View>
      <Card onPress={onPress}>
        <View style={styles.header}>
          <BeanThumb />
          <View style={styles.titles}>
            <View style={styles.tags}>
              {label ? <Tag label={label} tone={bean.roast_level === 'Light' ? 'success' : 'primary'} /> : null}
              {isLowStock(bean) ? <Tag label="Low stock" tone="danger" icon="alert-outline" /> : null}
            </View>
            <Text style={type.cardTitle} numberOfLines={2}>
              {bean.name}
            </Text>
            <Text style={type.bodyMedium} numberOfLines={1}>
              {place}
            </Text>
          </View>
        </View>

        {notes.length > 0 ? (
          <View style={styles.notes}>
            {notes.map((note) => (
              <Chip key={note} label={note} variant="note" />
            ))}
          </View>
        ) : null}

        <StockMeter bean={bean} />
      </Card>

      <Pressable
        onPress={onMenu}
        style={styles.menu}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={`More options for ${bean.name}`}
      >
        <Icon name="dots-vertical" size={20} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

// Placeholder photo: there is no image upload in this app.
export function BeanThumb({ size = 48 }: { size?: number }) {
  return (
    <View style={[styles.thumb, { width: size, height: size }]}>
      <Icon name="coffee" size={size * 0.5} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: spacing.md, paddingRight: 32 },
  titles: { flex: 1, gap: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  notes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  thumb: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  menu: {
    position: 'absolute',
    top: 6,
    right: 4,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
});
