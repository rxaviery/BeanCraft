// One form for both CREATE and UPDATE. Pass `initial` to edit an existing bean.
// Inputs are controlled (React state), validated with the same rules as
// beans.php, and server-side 422 errors show under the matching field.
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage, fieldErrors, type Bean, type BeanInput } from '@/api/client';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Card } from './Card';
import { Chip } from './Chip';
import { Icon, type IconName } from './Icon';
import { SegmentedControl } from './SegmentedControl';
import { StarRating } from './StarRating';
import { TextField } from './TextField';
import { useToast } from './Toast';
import { TopBar } from './TopBar';
import { colors, fonts, radius, spacing, type } from '@/theme/tokens';
import { BAG_SIZES, NOTE_PRESETS, notesToList, PROCESS_METHODS, ROAST_LEVELS } from '@/utils/bean';

// Everything the inputs hold. Numbers stay as text while typing.
type FormState = {
  name: string;
  roaster: string;
  origin: string;
  farm: string;
  process_method: string;
  roast_level: string;
  roast_date: string;
  altitude: string;
  notes: string[];
  bag_weight_g: string;
  remaining_g: string;
  price: string;
  rating: number | null;
  cupping_notes: string;
};

type Errors = Record<string, string>;

type Props = {
  title: string;
  submitLabel: string;
  initial?: Bean; // present = editing
  onSubmit: (input: BeanInput) => Promise<void>;
};

export function BeanForm({ title, submitLabel, initial, onSubmit }: Props) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const editing = initial !== undefined;
  const [start] = useState(() => toForm(initial));
  const [form, setForm] = useState(start);
  const [errors, setErrors] = useState<Errors>({});
  const [customNote, setCustomNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Updates one field and clears its error message.
  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key === 'notes' ? 'tasting_notes' : key]: '' }));
  }

  function toggleNote(note: string) {
    set('notes', form.notes.includes(note) ? form.notes.filter((n) => n !== note) : [...form.notes, note]);
  }

  function addCustomNote() {
    const note = customNote.trim().replace(/,/g, '');
    if (note && !form.notes.includes(note)) set('notes', [...form.notes, note]);
    setCustomNote('');
  }

  function cancel() {
    const dirty = JSON.stringify(form) !== JSON.stringify(start);
    if (dirty) setConfirmDiscard(true);
    else router.back();
  }

  async function save() {
    const found = validate(form, editing);
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

  const noteChoices = [...NOTE_PRESETS, ...form.notes.filter((n) => !NOTE_PRESETS.includes(n))];

  return (
    <View style={styles.screen}>
      <TopBar title={title} backLabel="Cancel" onBack={cancel} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Section icon="sprout-outline" title="Essential info">
            <TextField label="Bean / variety name *" placeholder="e.g. Ethiopia Guji Gesha" value={form.name} onChangeText={(v) => set('name', v)} error={errors.name} />
            <TextField label="Roaster *" placeholder="e.g. Yardstick Coffee" value={form.roaster} onChangeText={(v) => set('roaster', v)} error={errors.roaster} />
            <TextField label="Origin / region" placeholder="e.g. Benguet, Philippines" value={form.origin} onChangeText={(v) => set('origin', v)} error={errors.origin} />
            <TextField label="Farm / producer" placeholder="e.g. Sitio Bangao" value={form.farm} onChangeText={(v) => set('farm', v)} error={errors.farm} />
          </Section>

          <Section icon="fire" title="Roast & processing">
            <Text style={type.label}>Process method</Text>
            <View style={styles.wrap}>
              {PROCESS_METHODS.map((p) => (
                <Chip key={p} label={p} selected={form.process_method === p} onPress={() => set('process_method', form.process_method === p ? '' : p)} />
              ))}
            </View>
            <Text style={type.label}>Roast degree</Text>
            <SegmentedControl options={ROAST_LEVELS} value={form.roast_level || null} onChange={(v) => set('roast_level', v)} />
            <View style={styles.dateRow}>
              <View style={styles.flex}>
                <TextField label="Roast date" placeholder="YYYY-MM-DD" value={form.roast_date} onChangeText={(v) => set('roast_date', v)} error={errors.roast_date} keyboardType="numbers-and-punctuation" maxLength={10} />
              </View>
              <Chip label="Today" onPress={() => set('roast_date', today())} />
            </View>
            <TextField label="Altitude" placeholder="e.g. 1,600 masl" value={form.altitude} onChangeText={(v) => set('altitude', v)} error={errors.altitude} />
          </Section>

          <Section icon="palette-outline" title="Tasting notes">
            <View style={styles.wrap}>
              {noteChoices.map((n) => (
                <Chip key={n} label={n} variant="note" selected={form.notes.includes(n)} onPress={() => toggleNote(n)} />
              ))}
            </View>
            <View style={styles.dateRow}>
              <View style={styles.flex}>
                <TextField label="Add your own" placeholder="e.g. Lemongrass" value={customNote} onChangeText={setCustomNote} onSubmitEditing={addCustomNote} returnKeyType="done" error={errors.tasting_notes} />
              </View>
              <Pressable style={styles.addNote} onPress={addCustomNote} accessibilityRole="button" accessibilityLabel="Add tasting note">
                <Icon name="plus" size={22} color={colors.text} />
              </Pressable>
            </View>
          </Section>

          <Section icon="archive-outline" title="Inventory & price">
            <Text style={type.label}>Bag weight (grams) *</Text>
            <View style={styles.wrap}>
              {BAG_SIZES.map((g) => (
                <Chip key={g} label={`${g}g`} selected={form.bag_weight_g === String(g)} onPress={() => set('bag_weight_g', String(g))} />
              ))}
            </View>
            <TextField label="Or type the weight" placeholder="250" value={form.bag_weight_g} onChangeText={(v) => set('bag_weight_g', v)} error={errors.bag_weight_g} keyboardType="number-pad" />
            {editing ? (
              <TextField label="Remaining (grams)" value={form.remaining_g} onChangeText={(v) => set('remaining_g', v)} error={errors.remaining_g} keyboardType="number-pad" />
            ) : null}
            <TextField label="Purchase price (₱)" placeholder="0.00" value={form.price} onChangeText={(v) => set('price', v)} error={errors.price} keyboardType="decimal-pad" />
          </Section>

          <Section icon="star-outline" title="Cup score & notes">
            <View style={styles.scoreRow}>
              <StarRating value={form.rating} onChange={(v) => set('rating', v)} size={30} />
              <Text style={styles.score}>{form.rating === null ? 'Not rated' : `${form.rating.toFixed(1)} / 5`}</Text>
            </View>
            {errors.rating ? <Text style={styles.error}>{errors.rating}</Text> : null}
            <TextField label="Cupping notes" placeholder="How does it taste? What would you change next brew?" value={form.cupping_notes} onChangeText={(v) => set('cupping_notes', v)} error={errors.cupping_notes} multiline />
          </Section>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button title={submitLabel} icon="content-save-outline" loading={saving} onPress={save} />
        </View>
      </KeyboardAvoidingView>

      <BottomSheet visible={confirmDiscard} onClose={() => setConfirmDiscard(false)}>
        <Text style={type.heading}>Discard changes?</Text>
        <Text style={type.body}>What you typed on this screen won't be saved.</Text>
        <Button
          title="Discard"
          variant="danger"
          onPress={() => {
            setConfirmDiscard(false);
            router.back();
          }}
        />
        <Button title="Keep editing" variant="secondary" onPress={() => setConfirmDiscard(false)} />
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

// ---- Converting between the API bean and the form ----

function toForm(bean?: Bean): FormState {
  return {
    name: bean?.name ?? '',
    roaster: bean?.roaster ?? '',
    origin: bean?.origin ?? '',
    farm: bean?.farm ?? '',
    process_method: bean?.process_method ?? '',
    roast_level: bean?.roast_level ?? '',
    roast_date: bean?.roast_date ?? '',
    altitude: bean?.altitude ?? '',
    notes: notesToList(bean?.tasting_notes ?? null),
    bag_weight_g: bean ? String(bean.bag_weight_g) : '250',
    remaining_g: bean ? String(bean.remaining_g) : '',
    price: bean?.price != null ? bean.price.toFixed(2) : '',
    rating: bean?.rating ?? null,
    cupping_notes: bean?.cupping_notes ?? '',
  };
}

// Empty text becomes null so the database stores "no value".
const orNull = (value: string) => value.trim() || null;

function toInput(f: FormState, editing: boolean): BeanInput {
  return {
    name: f.name.trim(),
    roaster: f.roaster.trim(),
    origin: orNull(f.origin),
    farm: orNull(f.farm),
    process_method: orNull(f.process_method),
    roast_level: orNull(f.roast_level),
    roast_date: orNull(f.roast_date),
    altitude: orNull(f.altitude),
    tasting_notes: f.notes.length > 0 ? f.notes.join(', ') : null,
    bag_weight_g: Number(f.bag_weight_g),
    // New beans: leave remaining out, the server fills it with the bag weight.
    ...(editing ? { remaining_g: Number(f.remaining_g) } : {}),
    price: f.price.trim() ? Number(f.price) : null,
    rating: f.rating,
    cupping_notes: orNull(f.cupping_notes),
  };
}

// Same rules as validate_bean() in beans.php.
function validate(f: FormState, editing: boolean): Errors {
  const e: Errors = {};
  const tooLong = (value: string, max: number) => value.trim().length > max;

  if (!f.name.trim()) e.name = 'This field is required.';
  else if (tooLong(f.name, 100)) e.name = 'Maximum 100 characters.';
  if (!f.roaster.trim()) e.roaster = 'This field is required.';
  else if (tooLong(f.roaster, 100)) e.roaster = 'Maximum 100 characters.';
  if (tooLong(f.origin, 100)) e.origin = 'Maximum 100 characters.';
  if (tooLong(f.farm, 100)) e.farm = 'Maximum 100 characters.';
  if (tooLong(f.altitude, 50)) e.altitude = 'Maximum 50 characters.';
  if (f.notes.join(', ').length > 255) e.tasting_notes = 'Too many notes (255 characters max).';
  if (tooLong(f.cupping_notes, 5000)) e.cupping_notes = 'Maximum 5000 characters.';

  if (f.roast_date.trim() && !isRealDate(f.roast_date.trim())) e.roast_date = 'Use the format YYYY-MM-DD.';

  const bag = Number(f.bag_weight_g);
  if (!/^\d+$/.test(f.bag_weight_g) || bag < 1 || bag > 10000) e.bag_weight_g = 'Enter whole grams from 1 to 10000.';

  if (editing) {
    const remaining = Number(f.remaining_g);
    if (!/^\d+$/.test(f.remaining_g) || remaining > bag) e.remaining_g = 'Must be between 0 and the bag weight.';
  }

  if (f.price.trim() && (!/^\d+(\.\d{1,2})?$/.test(f.price.trim()) || Number(f.price) > 999999.99)) {
    e.price = 'Enter an amount like 450 or 450.50.';
  }
  return e;
}

function isRealDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function today() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  section: { gap: spacing.md },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  addNote: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
  },
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
