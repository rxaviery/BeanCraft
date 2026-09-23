// Header shown at the top of every screen.
// Tab screens: <TopBar section="Inventory" />  -> logo + app name
// Pushed screens: <TopBar title="Edit Bean" onBack={...} /> -> back button + title
import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from './Icon';
import { colors, fonts, spacing } from '@/theme/tokens';

type Props = {
  section?: string; // small label under "BeanCraft" on tab screens
  title?: string; // when set, shows a back button instead of the logo
  onBack?: () => void;
  backLabel?: string;
  right?: ReactNode;
};

export function TopBar({ section, title, onBack, backLabel = 'Back', right }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        {title ? (
          <>
            <Pressable onPress={onBack} hitSlop={12} style={styles.side} accessibilityRole="button">
              <Icon name="arrow-left" size={20} color={colors.text} />
              <Text style={styles.backText}>{backLabel}</Text>
            </Pressable>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </>
        ) : (
          <View style={styles.brand}>
            <Image source={require('../../assets/logo.jpg')} style={styles.logo} />
            <View>
              <Text style={styles.appName}>BeanCraft</Text>
              {section ? <Text style={styles.section}>{section}</Text> : null}
            </View>
          </View>
        )}
        <View style={[styles.side, styles.right]}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.track,
  },
  row: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  side: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  right: { justifyContent: 'flex-end' },
  backText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 32, height: 32, borderRadius: 8 },
  appName: { fontFamily: fonts.bold, fontSize: 17, letterSpacing: -0.4, color: colors.text },
  section: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.primary,
  },
});
