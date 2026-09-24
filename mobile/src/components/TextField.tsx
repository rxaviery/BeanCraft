// Labeled text input with an optional icon and error message.
// Passing secureTextEntry adds a show/hide password button.
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type TextStyle } from 'react-native';

import { Icon, type IconName } from './Icon';
import { colors, fonts, radius, spacing, type } from '@/theme/tokens';

type Props = TextInputProps & {
  label: string;
  error?: string;
  icon?: IconName;
};

export function TextField({ label, error, icon, secureTextEntry, multiline, onFocus, onBlur, style, ...input }: Props) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={type.label}>{label}</Text>
      <View style={[styles.box, multiline && styles.boxMultiline, focused && styles.boxFocused, error ? styles.boxError : null]}>
        {icon ? <Icon name={icon} size={18} color={colors.textSubtle} /> : null}
        <TextInput
          {...input}
          style={[styles.input, noFocusRing, multiline && styles.inputMultiline, style]}
          placeholderTextColor={colors.textSubtle}
          secureTextEntry={hidden}
          multiline={multiline}
          accessibilityLabel={label}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

// Web only: hide the browser's black focus ring (the box border shows focus
// instead). 'none' works on web but isn't in React Native's types, hence the cast.
const noFocusRing = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceMuted,
  },
  boxMultiline: { alignItems: 'flex-start', paddingVertical: spacing.md },
  boxFocused: { borderColor: colors.primary },
  boxError: { borderColor: colors.danger },
  input: {
    flex: 1,
    minWidth: 0, // web inputs have a built-in minimum width that overflows narrow boxes
    paddingVertical: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  inputMultiline: { minHeight: 96, paddingVertical: 0, textAlignVertical: 'top' },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.danger },
});
