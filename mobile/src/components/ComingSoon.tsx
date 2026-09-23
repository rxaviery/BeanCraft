// Body for tabs that aren't built yet (Brew Log, Stats).
import { StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from './Icon';
import { TopBar } from './TopBar';
import { colors, radius, spacing, type } from '@/theme/tokens';

type Props = { section: string; icon: IconName; title: string; text: string };

export function ComingSoon({ section, icon, title, text }: Props) {
  return (
    <View style={styles.screen}>
      <TopBar section={section} />
      <View style={styles.body}>
        <View style={styles.iconWell}>
          <Icon name={icon} size={32} color={colors.primary} />
        </View>
        <Text style={type.eyebrow}>Coming soon</Text>
        <Text style={[type.heading, styles.center]}>{title}</Text>
        <Text style={[type.body, styles.center]}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xxl },
  iconWell: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  center: { textAlign: 'center' },
});
