// Numbers for the Stats tab, all worked out from the beans already loaded.
import type { Bean } from '@/api/client';
import { freshness, isLowStock, ROAST_LEVELS } from './bean';

const AVERAGE_DOSE_G = 18;

export type Row = { label: string; value: number };

// Counts how many beans fall under each label, biggest first.
function countBy(beans: Bean[], labelOf: (b: Bean) => string): Row[] {
  const counts = new Map<string, number>();
  for (const bean of beans) {
    const label = labelOf(bean);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function computeStats(beans: Bean[]) {
  const onHand = beans.reduce((sum, b) => sum + b.remaining_g, 0);
  const used = beans.reduce((sum, b) => sum + (b.bag_weight_g - b.remaining_g), 0);

  // Roast mix keeps the roast order (Light -> Dark) instead of sorting by count.
  const roastCounts = countBy(beans, (b) => b.roast_level ?? 'Not set');
  const roastMix = [...ROAST_LEVELS, 'Not set']
    .map((label) => roastCounts.find((r) => r.label === label) ?? { label, value: 0 })
    .filter((r) => r.value > 0 || r.label !== 'Not set');

  const rated = beans.filter((b) => b.rating !== null);
  const topRated = rated.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0] ?? null;

  return {
    totalBags: beans.length,
    activeBags: beans.filter((b) => b.remaining_g > 0).length,
    onHand,
    cupsLeft: Math.floor(onHand / AVERAGE_DOSE_G),
    used,
    stashValue: beans.reduce((sum, b) => sum + (b.price ?? 0), 0),
    roastMix,
    topOrigins: countBy(beans.filter((b) => b.origin), (b) => b.origin as string).slice(0, 5),
    freshness: {
      resting: beans.filter((b) => freshness(b) === 'Resting').length,
      peak: beans.filter((b) => freshness(b) === 'Peak flavor').length,
      pastPeak: beans.filter((b) => freshness(b) === 'Past peak').length,
    },
    lowStock: beans.filter((b) => b.remaining_g > 0 && isLowStock(b)),
    topRated,
  };
}
