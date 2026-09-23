// READ: the logged-in user's stash. Loads from the API every time the tab is
// shown, so changes made on other screens appear right away. Search and roast
// filters work on the loaded list (no extra API calls).
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { errorMessage, getBeans, type Bean } from '@/api/client';
import { BeanCard } from '@/components/BeanCard';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { DeleteConfirm } from '@/components/DeleteConfirm';
import { Icon } from '@/components/Icon';
import { Loading, Message } from '@/components/StateView';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/Toast';
import { TopBar } from '@/components/TopBar';
import { colors, fonts, radius, spacing, type } from '@/theme/tokens';
import { ROAST_LEVELS } from '@/utils/bean';

const FILTERS = ['All', ...ROAST_LEVELS];

export default function InventoryScreen() {
  const toast = useToast();
  const [beans, setBeans] = useState<Bean[] | null>(null); // null = not loaded yet
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [roast, setRoast] = useState('All');
  // The ⋮ menu and the delete confirmation share one bottom sheet.
  const [sheet, setSheet] = useState<{ bean: Bean; mode: 'menu' | 'delete' } | null>(null);

  const load = useCallback(async () => {
    try {
      setBeans(await getBeans());
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

  const openBean = (bean: Bean) => router.push({ pathname: '/bean/[id]', params: { id: bean.id } });
  const editBean = (bean: Bean) => router.push({ pathname: '/bean/[id]/edit', params: { id: bean.id } });
  const addBean = () => router.push('/bean/new');

  // First load: full-screen spinner or error.
  if (beans === null) {
    return (
      <View style={styles.screen}>
        <TopBar section="Inventory" />
        {error ? (
          <Message
            icon="wifi-off"
            tone="error"
            title="Couldn't load your stash"
            text={error}
            actionLabel="Try again"
            onAction={() => {
              setError('');
              load();
            }}
          />
        ) : (
          <Loading />
        )}
      </View>
    );
  }

  const search = query.trim().toLowerCase();
  const visible = beans.filter(
    (b) =>
      (roast === 'All' || b.roast_level === roast) &&
      (!search ||
        [b.name, b.roaster, b.origin, b.farm, b.process_method, b.tasting_notes].some((field) =>
          field?.toLowerCase().includes(search),
        )),
  );
  const activeCount = beans.filter((b) => b.remaining_g > 0).length;

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View>
          <Text style={type.eyebrow}>Cellar reserve</Text>
          <Text style={type.title}>My Coffee Stash</Text>
        </View>
        <View style={styles.pill}>
          <View style={styles.dot} />
          <Text style={styles.pillText}>
            {activeCount} Active {activeCount === 1 ? 'Bag' : 'Bags'}
          </Text>
        </View>
      </View>

      {error ? <Text style={styles.banner}>Couldn't refresh: {error}</Text> : null}

      <TextField
        label="Search"
        icon="magnify"
        placeholder="Search roaster, origin, process..."
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} selected={roast === f} onPress={() => setRoast(f)} />
        ))}
      </ScrollView>

      {beans.length > 0 ? (
        <Text style={type.label}>
          Showing {visible.length} of {beans.length} {beans.length === 1 ? 'bag' : 'bags'}
        </Text>
      ) : null}
    </View>
  );

  const empty =
    beans.length === 0 ? (
      <Message
        icon="coffee-outline"
        title="Your stash is empty"
        text="Add your first bag of beans to start tracking what's left."
        actionLabel="Add a bag"
        onAction={addBean}
      />
    ) : (
      <Message
        icon="magnify-close"
        title="No matching beans"
        text="Try a different search or roast filter."
        actionLabel="Clear filters"
        onAction={() => {
          setQuery('');
          setRoast('All');
        }}
      />
    );

  return (
    <View style={styles.screen}>
      <TopBar section="Inventory" />
      <FlatList
        data={visible}
        keyExtractor={(b) => String(b.id)}
        renderItem={({ item }) => (
          <BeanCard bean={item} onPress={() => openBean(item)} onMenu={() => setSheet({ bean: item, mode: 'menu' })} />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />}
      />

      <Pressable style={styles.fab} onPress={addBean} accessibilityRole="button" accessibilityLabel="Add a bag">
        <Icon name="plus" size={28} color={colors.onInk} />
      </Pressable>

      <BottomSheet visible={sheet !== null} onClose={() => setSheet(null)}>
        {sheet?.mode === 'menu' ? (
          <>
            <Text style={type.heading} numberOfLines={1}>
              {sheet.bean.name}
            </Text>
            <Button
              title="Edit bean"
              icon="pencil-outline"
              onPress={() => {
                setSheet(null);
                editBean(sheet.bean);
              }}
            />
            <Button
              title="Delete bean"
              variant="secondary"
              icon="trash-can-outline"
              onPress={() => setSheet({ bean: sheet.bean, mode: 'delete' })}
            />
          </>
        ) : null}
        {sheet?.mode === 'delete' ? (
          <DeleteConfirm
            bean={sheet.bean}
            onCancel={() => setSheet(null)}
            onDeleted={() => {
              setBeans((list) => list?.filter((b) => b.id !== sheet.bean.id) ?? null);
              setSheet(null);
              toast('Bean deleted from your stash.', 'success');
            }}
          />
        ) : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { flexGrow: 1, gap: spacing.lg, padding: spacing.lg, paddingBottom: 110 },
  header: { gap: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.primary },
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
