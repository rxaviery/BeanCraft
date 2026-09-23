// Rounded pill you can tap to select.
// variant "filter": list filters (white, black when selected)
// variant "note":   tasting notes (beige, peach with a check when selected)
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from './Icon';
import { colors, fonts, radius } from '@/theme/tokens';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: 'filter' | 'note';
};

export function Chip({ label, selected = false, onPress, variant = 'filter' }: Props) {
  const look = variant === 'filter' ? filterLook(selected) : noteLook(selected);
  const content = (
    <>
      <Text style={[styles.text, look.text]}>{label}</Text>
      {variant === 'note' && selected ? <Icon name="check" size={12} color={colors.primary} /> : null}
    </>
  );

  // Display-only chips are plain Views, so they can sit inside a tappable card.
  if (!onPress) return <View style={[styles.chip, look.box]}>{content}</View>;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, look.box]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {content}
    </Pressable>
  );
}

function filterLook(selected: boolean) {
  return selected
    ? { box: { backgroundColor: colors.ink, borderColor: colors.ink }, text: { color: colors.onInk } }
    : { box: { backgroundColor: colors.surface, borderColor: colors.border }, text: { color: colors.textMuted } };
}

function noteLook(selected: boolean) {
  return selected
    ? { box: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }, text: { color: colors.primary } }
    : { box: { backgroundColor: colors.surfaceMuted, borderColor: colors.surfaceMuted }, text: { color: colors.textMuted } };
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  text: { fontFamily: fonts.semibold, fontSize: 12 },
});
