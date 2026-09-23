// Small helpers for showing brew data. No API calls here.
import type { Brew } from '@/api/client';
import type { IconName } from '@/components/Icon';

export const BREW_METHODS: { name: string; icon: IconName }[] = [
  { name: 'V60', icon: 'filter-outline' },
  { name: 'AeroPress', icon: 'cup-water' },
  { name: 'Espresso', icon: 'coffee' },
  { name: 'French Press', icon: 'coffee-maker-outline' },
  { name: 'Moka Pot', icon: 'kettle-steam-outline' },
  { name: 'Cold Brew', icon: 'snowflake' },
];

export const DOSE_PRESETS = [15, 18, 20];

export function methodIcon(method: string): IconName {
  return BREW_METHODS.find((m) => m.name === method)?.icon ?? 'coffee-outline';
}

// 15g coffee + 250g water -> "1:16.7"
export function brewRatio(dose: number, water: number | null) {
  return water && dose > 0 ? `1:${(water / dose).toFixed(1)}` : null;
}

// 165 -> "2:45"
export function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

// "2:45" or "165" -> 165 seconds. Returns null when it can't be read.
export function parseDuration(text: string) {
  const value = text.trim();
  const clock = /^(\d{1,2}):([0-5]\d)$/.exec(value);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
  return /^\d+$/.test(value) ? Number(value) : null;
}

// "2026-09-23 08:15:00" -> "Today, 8:15 AM" / "Yesterday, 8:15 AM" / "Sep 20, 8:15 AM"
export function formatBrewedAt(value: string) {
  const [date, time = '00:00'] = value.split(' ');
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const when = new Date(y, m - 1, d, h, min);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - new Date(y, m - 1, d).getTime()) / 86_400_000);
  const clock = when.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  if (days === 0) return `Today, ${clock}`;
  if (days === 1) return `Yesterday, ${clock}`;
  return `${when.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${clock}`;
}

// "15g → 250g • 1:16.7 • 2:45", skipping whatever wasn't logged.
export function brewSummary(brew: Brew) {
  const amounts = brew.water_g ? `${brew.dose_g}g → ${brew.water_g}g` : `${brew.dose_g}g`;
  return [
    amounts,
    brewRatio(brew.dose_g, brew.water_g),
    brew.brew_time_s ? formatDuration(brew.brew_time_s) : null,
    brew.water_temp_c ? `${brew.water_temp_c}°C` : null,
  ]
    .filter(Boolean)
    .join(' • ');
}
