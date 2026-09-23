// Five stars. Read-only when onChange is missing; otherwise tap a star to set
// the score, or tap the current score again to clear it.
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from './Icon';
import { colors } from '@/theme/tokens';

type Props = {
  value: number | null;
  onChange?: (value: number | null) => void;
  size?: number;
};

export function StarRating({ value, onChange, size = 22 }: Props) {
  const score = value ?? 0;

  return (
    <View style={styles.row} accessibilityLabel={`${score} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const name = score >= star ? 'star' : score >= star - 0.5 ? 'star-half-full' : 'star-outline';
        const icon = <Icon name={name} size={size} color={colors.primary} />;
        if (!onChange) return <View key={star}>{icon}</View>;
        return (
          <Pressable
            key={star}
            onPress={() => onChange(star === value ? null : star)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${star} star${star > 1 ? 's' : ''}`}
          >
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
});
