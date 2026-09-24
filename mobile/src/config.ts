// The only place API addresses live. Change them here if a host changes.

// Our own PHP + MySQL API on Freehostia (via DuckDNS).
// For local testing (e.g. XAMPP) start Expo with EXPO_PUBLIC_API_URL=http://<your-pc-ip>:8765
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://rxaviery.duckdns.org';

// Third-party API: ExchangeRate-API open access (free, no key). Rates are per 1 Philippine peso.
export const EXCHANGE_RATES_URL = 'https://open.er-api.com/v6/latest/PHP';
