// Row of options where exactly one is selected (e.g. roast level).
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, shadow } from '@/theme/tokens';

type Props = {
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
};

export function SegmentedControl({ options, value, onChange }: Props) {
  return (
    <View style={styles.track} accessibilityRole="radiogroup">
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.segment, selected && styles.selected]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.text, selected && styles.textSelected]} numberOfLines={1}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  selected: { backgroundColor: colors.surface, ...shadow },
  text: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase', color: colors.textMuted },
  textSelected: { color: colors.text },
});
