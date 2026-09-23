// Full-area states: a loading spinner, or a message with an optional button
// (used for empty lists and errors).
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { colors, radius, spacing, type } from '@/theme/tokens';

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

type MessageProps = {
  icon: IconName;
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'default' | 'error';
};

export function Message({ icon, title, text, actionLabel, onAction, tone = 'default' }: MessageProps) {
  const error = tone === 'error';
  return (
    <View style={styles.center}>
      <View style={[styles.iconWell, error && styles.iconWellError]}>
        <Icon name={icon} size={30} color={error ? colors.danger : colors.primary} />
      </View>
      <Text style={[type.heading, styles.text]}>{title}</Text>
      <Text style={[type.body, styles.text]}>{text}</Text>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button title={actionLabel} onPress={onAction} variant={error ? 'secondary' : 'primary'} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xxl },
  iconWell: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  iconWellError: { backgroundColor: colors.dangerSoft },
  text: { textAlign: 'center', maxWidth: 300 },
  action: { marginTop: spacing.md, minWidth: 200 },
});
