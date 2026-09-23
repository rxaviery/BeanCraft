// Stats: insights about the stash, computed from the same beans list the
// Inventory tab loads. Reloads every time the tab is opened.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { errorMessage, getBeans, type Bean } from '@/api/client';
import { BarList } from '@/components/BarList';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { StarRating } from '@/components/StarRating';
import { Loading, Message } from '@/components/StateView';
import { TopBar } from '@/components/TopBar';
import { colors, fonts, radius, spacing, type } from '@/theme/tokens';
import { formatPeso } from '@/utils/bean';
import { computeStats } from '@/utils/stats';

export default function StatsScreen() {
  const [beans, setBeans] = useState<Bean[] | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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

  let body;
  if (beans === null) {
    body = error ? (
      <Message icon="wifi-off" tone="error" title="Couldn't load your stats" text={error} actionLabel="Try again" onAction={load} />
    ) : (
      <Loading />
    );
  } else if (beans.length === 0) {
    body = (
      <Message
        icon="chart-box-outline"
        title="No stats yet"
        text="Add a few bags to your stash and your numbers will show up here."
        actionLabel="Add a bag"
        onAction={() => router.push('/bean/new')}
      />
    );
  } else {
    const s = computeStats(beans);
    const tiles = [
      { label: 'Bags logged', value: String(s.totalBags) },
      { label: 'Active bags', value: String(s.activeBags) },
      { label: 'Used so far', value: `${s.used}g` },
      { label: 'Stash value', value: formatPeso(s.stashValue) },
    ];

    body = (
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <View>
          <Text style={type.eyebrow}>Stash insights</Text>
          <Text style={type.title}>Your Numbers</Text>
        </View>

        {error ? <Text style={styles.banner}>Couldn't refresh: {error}</Text> : null}

        <Card>
          <Text style={type.label}>Beans on hand</Text>
          <Text style={styles.hero}>{s.onHand}g</Text>
          <Text style={type.body}>About {s.cupsLeft} cups left at 18g per brew</Text>
        </Card>

        <View style={styles.tiles}>
          {tiles.map((t) => (
            <View key={t.label} style={styles.tile}>
              <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
                {t.value}
              </Text>
              <Text style={type.label}>{t.label}</Text>
            </View>
          ))}
        </View>

        <Card>
          <Text style={type.heading}>Roast mix</Text>
          <Text style={type.caption}>Number of bags per roast level</Text>
          <BarList rows={s.roastMix} />
        </Card>

        {s.topOrigins.length > 0 ? (
          <Card>
            <Text style={type.heading}>Top origins</Text>
            <Text style={type.caption}>Where your beans come from most</Text>
            <BarList rows={s.topOrigins} />
          </Card>
        ) : null}

        <Card>
          <Text style={type.heading}>Freshness</Text>
          <View style={styles.freshRow}>
            <FreshCount value={s.freshness.resting} label="Resting" />
            <FreshCount value={s.freshness.peak} label="Peak flavor" />
            <FreshCount value={s.freshness.pastPeak} label="Past peak" />
          </View>
          <Text style={type.caption}>Based on roast date. Beans without one aren't counted.</Text>
        </Card>

        <Card>
          <Text style={type.heading}>Running low</Text>
          {s.lowStock.length === 0 ? (
            <Text style={type.body}>Nothing is running low. Every open bag has over 20% left.</Text>
          ) : (
            s.lowStock.map((bean) => (
              <Pressable key={bean.id} onPress={() => openBean(bean)} style={styles.lowRow} accessibilityRole="button">
                <Icon name="alert-outline" size={18} color={colors.danger} />
                <Text style={styles.lowName} numberOfLines={1}>
                  {bean.name}
                </Text>
                <Text style={styles.lowGrams}>{bean.remaining_g}g left</Text>
                <Icon name="chevron-right" size={18} color={colors.textSubtle} />
              </Pressable>
            ))
          )}
        </Card>

        {s.topRated ? (
          <Card onPress={() => openBean(s.topRated!)}>
            <Text style={type.label}>Top rated</Text>
            <Text style={type.cardTitle}>{s.topRated.name}</Text>
            <Text style={type.bodyMedium}>{s.topRated.roaster}</Text>
            <StarRating value={s.topRated.rating} size={20} />
          </Card>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen}>
      <TopBar section="Stats" />
      {body}
    </View>
  );
}

function FreshCount({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.fresh}>
      <Text style={styles.freshValue}>{value}</Text>
      <Text style={styles.freshLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  banner: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.onDangerSoft,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  hero: { fontFamily: fonts.extrabold, fontSize: 44, lineHeight: 52, letterSpacing: -1, color: colors.text },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 2,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceTint,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileValue: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.primary },
  freshRow: { flexDirection: 'row', gap: spacing.sm },
  fresh: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  freshValue: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
  freshLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textMuted },
  lowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
  lowName: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  lowGrams: { fontFamily: fonts.bold, fontSize: 13, color: colors.danger },
});
