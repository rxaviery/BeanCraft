// Third-party API: live peso exchange rates from ExchangeRate-API.
// GET https://open.er-api.com/v6/latest/PHP returns JSON like:
//   { "result": "success", "time_last_update_utc": "Thu, 24 Sep 2026 00:02:32 +0000",
//     "rates": { "PHP": 1, "USD": 0.01727, "EUR": 0.01544, ... } }
// Rates only change once a day, so one request per app session is enough.
import { EXCHANGE_RATES_URL } from '@/config';

export type PesoRates = {
  updatedAt: Date;
  rates: Record<string, number>; // how much of each currency 1 peso buys
};

const TIMEOUT_MS = 15000;
let cached: Promise<PesoRates> | null = null;

export function getPesoRates(): Promise<PesoRates> {
  if (!cached) {
    cached = fetchRates().catch((error) => {
      cached = null; // don't keep a failure; try again next time
      throw error;
    });
  }
  return cached;
}

async function fetchRates(): Promise<PesoRates> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(EXCHANGE_RATES_URL, { signal: controller.signal });
    const json = await response.json();
    if (json.result !== 'success') throw new Error('The exchange-rate service returned an error.');
    return { updatedAt: new Date(json.time_last_update_utc), rates: json.rates };
  } catch {
    throw new Error("Couldn't load live exchange rates. Check your connection.");
  } finally {
    clearTimeout(timer);
  }
}
