// Small helpers for showing bean data. No API calls here.
import type { Bean } from '@/api/client';

export const ROAST_LEVELS = ['Light', 'Med-Light', 'Medium', 'Dark'];
export const PROCESS_METHODS = ['Washed', 'Natural', 'Honey', 'Anaerobic'];
export const NOTE_PRESETS = ['Jasmine', 'Citrus', 'Stone Fruit', 'Berries', 'Chocolate', 'Caramel', 'Nutty', 'Floral'];
export const BAG_SIZES = [250, 340, 500, 1000];
export const DOSES = [15, 18, 20]; // quick "log a dose" buttons, in grams

const LOW_STOCK_RATIO = 0.2; // under 20% of the bag = low stock
const AVERAGE_DOSE_G = 18;

// "Jasmine, Peach" -> ["Jasmine", "Peach"]
export function notesToList(notes: string | null) {
  return notes ? notes.split(',').map((n) => n.trim()).filter(Boolean) : [];
}

export function isLowStock(bean: Bean) {
  return bean.remaining_g <= bean.bag_weight_g * LOW_STOCK_RATIO;
}

export function brewsLeft(bean: Bean) {
  return Math.floor(bean.remaining_g / AVERAGE_DOSE_G);
}

export function stockPercent(bean: Bean) {
  return Math.min(100, Math.round((bean.remaining_g / bean.bag_weight_g) * 100));
}

// Turns "2026-09-10" or "2026-09-10 11:48:18" into a local Date.
function toDate(value: string) {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function daysSince(value: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - toDate(value).getTime()) / 86_400_000);
}

export function roastedAgo(bean: Bean) {
  if (!bean.roast_date) return null;
  const days = daysSince(bean.roast_date);
  if (days < 0) return `Roasts on ${formatDate(bean.roast_date)}`;
  if (days === 0) return 'Roasted today';
  if (days === 1) return 'Roasted yesterday';
  return `Roasted ${days} days ago`;
}

// Coffee needs a few days to rest after roasting and tastes best for about a month.
export function freshness(bean: Bean) {
  if (!bean.roast_date) return null;
  const days = daysSince(bean.roast_date);
  if (days < 0) return null;
  if (days < 4) return 'Resting';
  if (days <= 30) return 'Peak flavor';
  return 'Past peak';
}

export function formatDate(value: string) {
  return toDate(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatPeso(amount: number) {
  return '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// "Light • Washed", skipping whichever is missing.
export function roastAndProcess(bean: Bean) {
  return [bean.roast_level, bean.process_method].filter(Boolean).join(' • ');
}
