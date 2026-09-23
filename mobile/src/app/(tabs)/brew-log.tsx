// READ: every brew the user logged, newest first, with a filter by method.
// Reloads each time the tab is opened.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { errorMessage, getBrews, type Brew } from '@/api/client';
import { BrewCard } from '@/components/BrewCard';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { Loading, Message } from '@/components/StateView';
import { TopBar } from '@/components/TopBar';
import { colors, fonts, radius, spacing, type } from '@/theme/tokens';

export default function BrewLogScreen() {
  const [brews, setBrews] = useState<Brew[] | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [method, setMethod] = useState('All');

  const load = useCallback(async () => {
    try {
      setBrews(await getBrews());
      setError('');
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const logBrew = () => router.push('/brew/new');

  if (brews === null) {
    return (
      <View style={styles.screen}>
        <TopBar section="Brew Log" />
        {error ? (
          <Message icon="wifi-off" tone="error" title="Couldn't load your brews" text={error} actionLabel="Try again" onAction={load} />
        ) : (
          <Loading />
        )}
      </View>
    );
  }

  // Filter chips only for methods that were actually used.
  const methods = ['All', ...new Set(brews.map((b) => b.method))];
  const visible = method === 'All' ? brews : brews.filter((b) => b.method === method);
  const rated = brews.filter((b) => b.rating !== null);
  const average = rated.length ? rated.reduce((sum, b) => sum + (b.rating ?? 0), 0) / rated.length : null;

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View>
          <Text style={type.eyebrow}>Brew journal</Text>
          <Text style={type.title}>Brew Log</Text>
        </View>
        <View style={styles.pill}>
          <Icon name="star" size={13} color={colors.primary} />
          <Text style={styles.pillText}>{average === null ? 'No ratings' : `${average.toFixed(1)} avg`}</Text>
        </View>
      </View>

      {error ? <Text style={styles.banner}>Couldn't refresh: {error}</Text> : null}

      {brews.length > 0 ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {methods.map((m) => (
              <Chip key={m} label={m} selected={method === m} onPress={() => setMethod(m)} />
            ))}
          </ScrollView>
          <Text style={type.label}>
            {visible.length} {visible.length === 1 ? 'brew' : 'brews'}
          </Text>
        </>
      ) : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <TopBar section="Brew Log" />
      <FlatList
        data={visible}
        keyExtractor={(b) => String(b.id)}
        renderItem={({ item }) => (
          <BrewCard brew={item} onPress={() => router.push({ pathname: '/brew/[id]', params: { id: item.id } })} />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <Message
            icon="coffee-outline"
            title="No brews yet"
            text="Log your first cup: pick a bean, a method and a dose. The grams come out of the bag automatically."
            actionLabel="Log a brew"
            onAction={logBrew}
          />
        }
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />}
      />

      <Pressable style={styles.fab} onPress={logBrew} accessibilityRole="button" accessibilityLabel="Log a brew">
        <Icon name="plus" size={28} color={colors.onInk} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { flexGrow: 1, gap: spacing.md, padding: spacing.lg, paddingBottom: 110 },
  header: { gap: spacing.lg, marginBottom: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  pillText: { fontFamily: fonts.bold, fontSize: 12, color: colors.onPrimarySoft },
  banner: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.onDangerSoft,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  filters: { gap: spacing.sm },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    boxShadow: '0px 6px 16px rgba(30, 27, 21, 0.25)',
  },
});
