// "Price around the world": converts a bean's peso price into other
// currencies using live rates from ExchangeRate-API (our third-party API).
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { getPesoRates, type PesoRates } from '@/api/rates';
import { Card } from './Card';
import { Icon } from './Icon';
import { colors, fonts, radius, spacing, type } from '@/theme/tokens';
import { formatPeso } from '@/utils/bean';

const CURRENCIES = ['USD', 'EUR', 'JPY', 'GBP'];

const money = (amount: number, currency: string) =>
  amount.toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: currency === 'JPY' ? 0 : 2 });

export function PriceAroundWorld({ pesos }: { pesos: number | null }) {
  const [data, setData] = useState<PesoRates | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    getPesoRates()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (pesos !== null) load();
  }, [pesos, load]);

  let body;
  if (pesos === null) {
    body = <Text style={type.body}>Add a purchase price (Edit Bean) to see it in other currencies.</Text>;
  } else if (error) {
    body = (
      <View style={styles.errorRow}>
        <Text style={[type.body, styles.flex]}>{error}</Text>
        <Pressable onPress={load} hitSlop={8} accessibilityRole="button">
          <Text style={styles.retry}>Retry</Text>
        </Pressable>
      </View>
    );
  } else if (!data) {
    body = <ActivityIndicator color={colors.primary} style={styles.loading} />;
  } else {
    body = (
      <>
        <Text style={type.body}>{formatPeso(pesos)} is about</Text>
        <View style={styles.grid}>
          {CURRENCIES.filter((c) => data.rates[c]).map((currency) => (
            <View key={currency} style={styles.tile}>
              <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
                {money(pesos * data.rates[currency], currency)}
              </Text>
              <Text style={styles.code}>{currency}</Text>
              <Text style={type.caption}>
                {formatPeso(1 / data.rates[currency])} per {money(1, currency)}
              </Text>
            </View>
          ))}
        </View>
        <Text style={type.caption}>
          Rates updated{' '}
          {data.updatedAt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}{' '}
          • Source: open.er-api.com
        </Text>
      </>
    );
  }

  return (
    <Card>
      <View style={styles.header}>
        <Icon name="earth" size={18} color={colors.primary} />
        <Text style={[type.label, styles.flex]}>Price around the world</Text>
        {data && pesos !== null && !error ? (
          <View style={styles.live}>
            <View style={styles.dot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        ) : null}
      </View>
      {body}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
  },
  dot: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.onSuccess },
  liveText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.onSuccess },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTint,
  },
  amount: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },
  code: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.5, color: colors.primary },
  loading: { paddingVertical: spacing.lg },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  retry: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary },
});
