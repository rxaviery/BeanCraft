// Bean Details: everything about one bag, quick "log a dose" buttons that save
// instantly, and the Edit / Delete actions.
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage, getBean, updateBean, type Bean } from '@/api/client';
import { BeanThumb } from '@/components/BeanCard';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { DeleteConfirm } from '@/components/DeleteConfirm';
import { StarRating } from '@/components/StarRating';
import { Loading, Message } from '@/components/StateView';
import { StockMeter } from '@/components/StockMeter';
import { Tag } from '@/components/Tag';
import { useToast } from '@/components/Toast';
import { TopBar } from '@/components/TopBar';
import { colors, fonts, radius, spacing, type } from '@/theme/tokens';
import { DOSES, formatDate, formatPeso, isLowStock, notesToList, roastAndProcess } from '@/utils/bean';

export default function BeanDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [bean, setBean] = useState<Bean | null>(null);
  const [error, setError] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setBean(await getBean(Number(id)));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [id]);

  // Reload whenever the screen is shown (e.g. after coming back from Edit).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const back = () => router.back();

  if (!bean) {
    return (
      <View style={styles.screen}>
        <TopBar title="Bean Details" onBack={back} />
        {error ? <Message icon="alert-circle-outline" tone="error" title="Couldn't load this bean" text={error} actionLabel="Try again" onAction={load} /> : <Loading />}
      </View>
    );
  }

  // Saves a new remaining amount right away (dose buttons and Restock).
  async function setRemaining(grams: number, message: string) {
    if (!bean) return;
    setAdjusting(true);
    try {
      setBean(await updateBean(bean.id, { remaining_g: grams }));
      toast(message, 'success');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setAdjusting(false);
    }
  }

  const label = roastAndProcess(bean);
  const notes = notesToList(bean.tasting_notes);
  const facts: [string, string | null][] = [
    ['Origin', bean.origin],
    ['Farm', bean.farm],
    ['Process', bean.process_method],
    ['Roast level', bean.roast_level],
    ['Roast date', bean.roast_date ? formatDate(bean.roast_date) : null],
    ['Altitude', bean.altitude],
    ['Price', bean.price !== null ? formatPeso(bean.price) : null],
    ['Added', formatDate(bean.created_at)],
  ];

  return (
    <View style={styles.screen}>
      <TopBar title="Bean Details" onBack={back} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Card>
          <View style={styles.hero}>
            <BeanThumb size={64} />
            <View style={styles.heroText}>
              <View style={styles.tags}>
                {label ? <Tag label={label} tone={bean.roast_level === 'Light' ? 'success' : 'primary'} /> : null}
                {isLowStock(bean) ? <Tag label="Low stock" tone="danger" icon="alert-outline" /> : null}
              </View>
              <Text style={type.heading}>{bean.name}</Text>
              <Text style={type.bodyMedium}>{bean.roaster}</Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={type.label}>Stash balance</Text>
          <StockMeter bean={bean} />
          <Text style={type.label}>Log today's dose</Text>
          <View style={styles.doses}>
            {DOSES.map((g) => (
              <DoseButton
                key={g}
                label={`−${g}g`}
                disabled={adjusting || bean.remaining_g === 0}
                onPress={() => setRemaining(Math.max(0, bean.remaining_g - g), `Logged a ${g}g dose.`)}
              />
            ))}
            <DoseButton
              label="Restock"
              highlight
              disabled={adjusting || bean.remaining_g === bean.bag_weight_g}
              onPress={() => setRemaining(bean.bag_weight_g, 'Bag restocked to full.')}
            />
          </View>
        </Card>

        <Card>
          <Text style={type.label}>Details</Text>
          <View style={styles.facts}>
            {facts.map(([name, value]) => (
              <View key={name} style={styles.fact}>
                <Text style={type.caption}>{name}</Text>
                <Text style={styles.factValue}>{value ?? '—'}</Text>
              </View>
            ))}
          </View>
        </Card>

        {notes.length > 0 ? (
          <Card>
            <Text style={type.label}>Tasting notes</Text>
            <View style={styles.tags}>
              {notes.map((n) => (
                <Chip key={n} label={n} variant="note" />
              ))}
            </View>
          </Card>
        ) : null}

        <Card>
          <View style={styles.scoreRow}>
            <Text style={type.label}>Cup score</Text>
            <Text style={styles.score}>{bean.rating === null ? 'Not rated' : `${bean.rating.toFixed(1)} / 5`}</Text>
          </View>
          <StarRating value={bean.rating} size={24} />
          <Text style={type.body}>{bean.cupping_notes || 'No cupping notes yet. Tap Edit to add some.'}</Text>
        </Card>

        <Button
          title="Edit Bean"
          icon="pencil-outline"
          onPress={() => router.push({ pathname: '/bean/[id]/edit', params: { id: bean.id } })}
        />
        <Button title="Delete Bean" variant="secondary" icon="trash-can-outline" onPress={() => setConfirmDelete(true)} />
      </ScrollView>

      <BottomSheet visible={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DeleteConfirm
          bean={bean}
          onCancel={() => setConfirmDelete(false)}
          onDeleted={() => {
            setConfirmDelete(false);
            toast('Bean deleted from your stash.', 'success');
            router.back();
          }}
        />
      </BottomSheet>
    </View>
  );
}

type DoseProps = { label: string; onPress: () => void; disabled: boolean; highlight?: boolean };

function DoseButton({ label, onPress, disabled, highlight = false }: DoseProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.dose, highlight && styles.doseHighlight, (pressed || disabled) && styles.doseDim]}
      accessibilityRole="button"
    >
      <Text style={[styles.doseText, highlight && styles.doseTextHighlight]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.lg, padding: spacing.lg },
  hero: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  heroText: { flex: 1, gap: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  doses: { flexDirection: 'row', gap: spacing.sm },
  dose: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  doseHighlight: { backgroundColor: colors.primarySoft },
  doseDim: { opacity: 0.5 },
  doseText: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  doseTextHighlight: { color: colors.primary },
  facts: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md },
  fact: { width: '50%', gap: 2, paddingRight: spacing.sm },
  factValue: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  score: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
});
