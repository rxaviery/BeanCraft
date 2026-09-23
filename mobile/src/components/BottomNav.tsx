// Custom tab bar used by src/app/(tabs)/_layout.tsx.
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from './Icon';
import { colors, fonts } from '@/theme/tokens';

// Route file name -> label and icon.
const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Inventory', icon: 'archive-outline' },
  'brew-log': { label: 'Brew Log', icon: 'coffee-outline' },
  stats: { label: 'Stats', icon: 'chart-box-outline' },
  profile: { label: 'Profile', icon: 'account-circle-outline' },
};

export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, i) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const active = state.index === i;
        const color = active ? colors.primary : colors.textMuted;

        return (
          <Pressable
            key={route.key}
            style={styles.tab}
            onPress={() => navigation.navigate(route.name, route.params)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Icon name={tab.icon} size={22} color={color} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.track,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
