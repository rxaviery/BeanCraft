// One form to log a new brew or edit an existing one (pass `initial`).
// Validates with the same rules as brews.php. When editing, a Delete button
// appears; the bean can only be chosen when logging a new brew.
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage, fieldErrors, getBeans, type Bean, type Brew, type BrewInput } from '@/api/client';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Card } from './Card';
import { Chip } from './Chip';
import { Icon, type IconName } from './Icon';
import { StarRating } from './StarRating';
import { Loading } from './StateView';
import { TextField } from './TextField';
import { useToast } from './Toast';
import { TopBar } from './TopBar';
import { colors, fonts, radius, spacing, type } from '@/theme/tokens';
import { BREW_METHODS, brewRatio, DOSE_PRESETS, formatDuration, parseDuration } from '@/utils/brew';

type FormState = {
  bean_id: number | null;
  method: string;
  dose_g: string;
  water_g: string;
  brew_time: string; // "m:ss"
  water_temp_c: string;
  grind: string;
  rating: number | null;
  notes: string;
};

type Props = {
  title: string;
  submitLabel: string;
  initial?: Brew; // present = editing
  beanId?: number; // preselected bean when logging from Bean Details
  onSubmit: (input: BrewInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function BrewForm({ title, submitLabel, initial, beanId, onSubmit, onDelete }: Props) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const editing = initial !== undefined;
  const [start] = useState(() => toForm(initial, beanId));
  const [form, setForm] = useState(start);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [beans, setBeans] = useState<Bean[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [sheet, setSheet] = useState<'discard' | 'delete' | null>(null);
  const [deleting, setDeleting] = useState(false);

  // The bean picker needs the user's beans (only when logging a new brew).
  useEffect(() => {
    if (editing) return;
    getBeans()
      .then(setBeans)
      .catch((e) => toast(errorMessage(e), 'error'));
  }, [editing, toast]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key === 'brew_time' ? 'brew_time_s' : key]: '' }));
  }

  function cancel() {
    if (JSON.stringify(form) !== JSON.stringify(start)) setSheet('discard');
    else router.back();
  }

  async function save() {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast('Please fix the highlighted fields.', 'error');
      return;
    }
    setSaving(true);
    try {
      await onSubmit(toInput(form, editing));
    } catch (error) {
      setErrors(fieldErrors(error));
      toast(errorMessage(error), 'error');
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      toast(errorMessage(error), 'error');
      setDeleting(false);
    }
  }

  // Beans worth brewing: anything with coffee left, plus the one already picked.
  const choices = (beans ?? []).filter((b) => b.remaining_g > 0 || b.id === form.bean_id);
  const picked = beans?.find((b) => b.id === form.bean_id);
  const dose = Number(form.dose_g);
  const ratio = brewRatio(dose, Number(form.water_g) || null);

  return (
    <View style={styles.screen}>
      <TopBar title={title} backLabel="Cancel" onBack={cancel} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Section icon="coffee-outline" title="Bean">
            {editing ? (
              <View>
                <Text style={type.cardTitle}>{initial.bean_name}</Text>
                <Text style={type.bodyMedium}>{initial.bean_roaster}</Text>
              </View>
            ) : beans === null ? (
              <Loading />
            ) : choices.length === 0 ? (
              <Text style={type.body}>No beans with coffee left. Add or restock a bag first.</Text>
            ) : (
              <>
                <View style={styles.wrap}>
                  {choices.map((b) => (
                    <Chip key={b.id} label={b.name} variant="note" selected={form.bean_id === b.id} onPress={() => set('bean_id', b.id)} />
                  ))}
                </View>
                {picked ? (
                  <Text style={type.caption}>
                    {picked.remaining_g}g left in this bag
                    {dose > 0 ? ` → ${Math.max(0, Math.round(picked.remaining_g - dose))}g after this brew` : ''}
                  </Text>
                ) : null}
                {errors.bean_id ? <Text style={styles.error}>{errors.bean_id}</Text> : null}
              </>
            )}
          </Section>

          <Section icon="filter-outline" title="Recipe">
            <Text style={type.label}>Brew method *</Text>
            <View style={styles.wrap}>
              {BREW_METHODS.map((m) => (
                <Chip key={m.name} label={m.name} selected={form.method === m.name} onPress={() => set('method', m.name)} />
              ))}
            </View>
            {errors.method ? <Text style={styles.error}>{errors.method}</Text> : null}

            <Text style={type.label}>Quick dose</Text>
            <View style={styles.wrap}>
              {DOSE_PRESETS.map((g) => (
                <Chip key={g} label={`${g}g`} selected={form.dose_g === String(g)} onPress={() => set('dose_g', String(g))} />
              ))}
            </View>
            <View style={styles.pair}>
              <View style={styles.flex}>
                <TextField label="Dose (g) *" placeholder="15" value={form.dose_g} onChangeText={(v) => set('dose_g', v)} error={errors.dose_g} keyboardType="decimal-pad" />
              </View>
              <View style={styles.flex}>
                <TextField label="Water / yield (g)" placeholder="250" value={form.water_g} onChangeText={(v) => set('water_g', v)} error={errors.water_g} keyboardType="number-pad" />
              </View>
            </View>
            <View style={styles.ratio}>
              <Text style={type.label}>Brew ratio</Text>
              <Text style={styles.ratioValue}>{ratio ?? '—'}</Text>
            </View>
            <View style={styles.pair}>
              <View style={styles.flex}>
                <TextField label="Brew time" placeholder="2:45" value={form.brew_time} onChangeText={(v) => set('brew_time', v)} error={errors.brew_time_s} keyboardType="numbers-and-punctuation" />
              </View>
              <View style={styles.flex}>
                <TextField label="Water temp (°C)" placeholder="93" value={form.water_temp_c} onChangeText={(v) => set('water_temp_c', v)} error={errors.water_temp_c} keyboardType="number-pad" />
              </View>
            </View>
            <TextField label="Grind setting" placeholder="e.g. 22 clicks" value={form.grind} onChangeText={(v) => set('grind', v)} error={errors.grind} />
          </Section>

          <Section icon="star-outline" title="How was it?">
            <View style={styles.scoreRow}>
              <StarRating value={form.rating} onChange={(v) => set('rating', v)} size={30} />
              <Text style={styles.score}>{form.rating === null ? 'Not rated' : `${form.rating.toFixed(1)} / 5`}</Text>
            </View>
            <TextField label="Tasting notes" placeholder="Sweet, bright, a bit sour? What to change next time?" value={form.notes} onChangeText={(v) => set('notes', v)} error={errors.notes} multiline />
          </Section>

          {onDelete ? <Button title="Delete Brew" variant="secondary" icon="trash-can-outline" onPress={() => setSheet('delete')} /> : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button title={submitLabel} icon="content-save-outline" loading={saving} onPress={save} />
        </View>
      </KeyboardAvoidingView>

      <BottomSheet visible={sheet !== null} onClose={() => setSheet(null)}>
        {sheet === 'delete' ? (
          <>
            <Text style={type.heading}>Delete this brew?</Text>
            <Text style={type.body}>
              The {initial?.dose_g}g used will go back to {initial?.bean_name}. This action cannot be undone.
            </Text>
            <Button title="Delete Brew" variant="danger" icon="trash-can-outline" loading={deleting} onPress={confirmDelete} />
            <Button title="Cancel" variant="secondary" disabled={deleting} onPress={() => setSheet(null)} />
          </>
        ) : (
          <>
            <Text style={type.heading}>Discard changes?</Text>
            <Text style={type.body}>What you typed on this screen won't be saved.</Text>
            <Button
              title="Discard"
              variant="danger"
              onPress={() => {
                setSheet(null);
                router.back();
              }}
            />
            <Button title="Keep editing" variant="secondary" onPress={() => setSheet(null)} />
          </>
        )}
      </BottomSheet>
    </View>
  );
}

function Section({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <Card style={styles.section}>
      <View style={styles.sectionTitle}>
        <Icon name={icon} size={20} color={colors.primary} />
        <Text style={type.heading}>{title}</Text>
      </View>
      {children}
    </Card>
  );
}

// ---- Converting between the API brew and the form ----

function toForm(brew?: Brew, beanId?: number): FormState {
  return {
    bean_id: brew?.bean_id ?? beanId ?? null,
    method: brew?.method ?? '',
    dose_g: brew ? String(brew.dose_g) : '',
    water_g: brew?.water_g != null ? String(brew.water_g) : '',
    brew_time: brew?.brew_time_s != null ? formatDuration(brew.brew_time_s) : '',
    water_temp_c: brew?.water_temp_c != null ? String(brew.water_temp_c) : '',
    grind: brew?.grind ?? '',
    rating: brew?.rating ?? null,
    notes: brew?.notes ?? '',
  };
}

const numberOrNull = (value: string) => (value.trim() ? Number(value) : null);

function toInput(f: FormState, editing: boolean): BrewInput {
  return {
    ...(editing ? {} : { bean_id: f.bean_id ?? undefined }),
    method: f.method,
    dose_g: Number(f.dose_g),
    water_g: numberOrNull(f.water_g),
    brew_time_s: f.brew_time.trim() ? parseDuration(f.brew_time) : null,
    water_temp_c: numberOrNull(f.water_temp_c),
    grind: f.grind.trim() || null,
    rating: f.rating,
    notes: f.notes.trim() || null,
  };
}

// Same rules as validate_brew() in brews.php.
function validate(f: FormState): Record<string, string> {
  const e: Record<string, string> = {};
  const inRange = (text: string, min: number, max: number, whole: boolean) =>
    (whole ? /^\d+$/ : /^\d+(\.\d)?$/).test(text.trim()) && Number(text) >= min && Number(text) <= max;

  if (f.bean_id === null) e.bean_id = 'Choose one of your beans.';
  if (!f.method) e.method = 'Choose a brew method.';
  if (!inRange(f.dose_g, 1, 100, false)) e.dose_g = 'Enter 1 to 100 grams.';
  if (f.water_g.trim() && !inRange(f.water_g, 1, 3000, true)) e.water_g = 'Enter 1 to 3000 grams.';
  if (f.brew_time.trim()) {
    const seconds = parseDuration(f.brew_time);
    if (seconds === null || seconds < 1 || seconds > 3600) e.brew_time_s = 'Use minutes:seconds, e.g. 2:45.';
  }
  if (f.water_temp_c.trim() && !inRange(f.water_temp_c, 50, 100, true)) e.water_temp_c = 'Enter 50 to 100 °C.';
  if (f.grind.trim().length > 50) e.grind = 'Maximum 50 characters.';
  if (f.notes.trim().length > 2000) e.notes = 'Maximum 2000 characters.';
  return e;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  section: { gap: spacing.md },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pair: { flexDirection: 'row', gap: spacing.md },
  ratio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTint,
  },
  ratioValue: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.primary },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  score: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.danger },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.track,
  },
});
