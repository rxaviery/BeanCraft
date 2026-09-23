// Full-width button. variant: primary (black), secondary (beige), danger (red).
// While loading it shows a spinner and can't be pressed again.
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Icon, type IconName } from './Icon';
import { colors, fonts, radius } from '@/theme/tokens';

const VARIANTS = {
  primary: { bg: colors.ink, fg: colors.onInk },
  secondary: { bg: colors.surfaceStrong, fg: colors.text },
  danger: { bg: colors.danger, fg: colors.onInk },
};

type Props = {
  title: string;
  onPress: () => void;
  variant?: keyof typeof VARIANTS;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ title, onPress, variant = 'primary', icon, loading = false, disabled = false }: Props) {
  const { bg, fg } = VARIANTS[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [styles.button, { backgroundColor: bg }, pressed && styles.pressed, inactive && styles.inactive]}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={fg} /> : null}
          <Text style={[styles.text, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    borderRadius: radius.md,
  },
  pressed: { opacity: 0.85 },
  inactive: { opacity: 0.5 },
  text: { fontFamily: fonts.semibold, fontSize: 15 },
});
