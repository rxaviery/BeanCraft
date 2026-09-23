// Profile: the real name and email, a few numbers computed from the stash,
// and log out (which sends the user back to Login).
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { getBeans, type Bean } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { TopBar } from '@/components/TopBar';
import { colors, fonts, radius, spacing, type } from '@/theme/tokens';
import { formatPeso } from '@/utils/bean';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [beans, setBeans] = useState<Bean[] | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getBeans().then(setBeans).catch(() => {}); // stats are optional; show dashes if this fails
    }, []),
  );

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const memberSince = new Date(user.created_at.replace(' ', 'T')).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  const stats = [
    { label: 'Bags logged', value: beans ? String(beans.length) : '—' },
    { label: 'Active bags', value: beans ? String(beans.filter((b) => b.remaining_g > 0).length) : '—' },
    { label: 'Beans on hand', value: beans ? `${beans.reduce((sum, b) => sum + b.remaining_g, 0)}g` : '—' },
    { label: 'Stash value', value: beans ? formatPeso(beans.reduce((sum, b) => sum + (b.price ?? 0), 0)) : '—' },
  ];

  return (
    <View style={styles.screen}>
      <TopBar section="Profile" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={type.heading}>{user.name}</Text>
              <Text style={type.body}>{user.email}</Text>
              <Text style={type.caption}>Member since {memberSince}</Text>
            </View>
          </View>

          <View style={styles.stats}>
            {stats.map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={type.label}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={styles.logout}>
          <View style={styles.logoutHeader}>
            <Icon name="logout" size={22} color={colors.danger} />
            <Text style={[type.heading, styles.logoutTitle]}>Log out of BeanCraft</Text>
          </View>
          <Text style={styles.logoutText}>You'll need to sign in again on this device. Your stash stays saved online.</Text>
          <Button
            title="Confirm Log Out"
            variant="danger"
            icon="logout"
            loading={loggingOut}
            onPress={async () => {
              setLoggingOut(true);
              await signOut(); // the auth guard then shows Login
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  flex: { flex: 1, gap: 2 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  initials: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.primary },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTint,
  },
  stat: { width: '50%', gap: 2 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.primary },
  logout: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dangerSoft,
    backgroundColor: 'rgba(255, 218, 214, 0.35)',
  },
  logoutHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoutTitle: { color: colors.onDangerSoft },
  logoutText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.onDangerSoft },
});
