import type { Weather } from './scoreCafes';

/**
 * Current Davao weather from Open-Meteo (free, no key). Fixed city coordinates, never the
 * visitor's position. Cached for 30 minutes; any failure returns null and logs once, and the
 * finder simply ranks without weather.
 */
const URL =
  'https://api.open-meteo.com/v1/forecast?latitude=7.07&longitude=125.61&current=temperature_2m,weather_code&timezone=Asia%2FManila';
const TTL_MS = 30 * 60_000;
const HOT_C = 31;

let cached: { at: number; value: Weather | null } | null = null;
let inFlight: Promise<Weather | null> | null = null;
let warned = false;

const describe = (tempC: number, code: number): Weather => {
  // WMO codes 51 and up are drizzle, rain, snow and thunderstorms
  const rainy = code >= 51 && code <= 99;
  const hot = tempC >= HOT_C;
  const rounded = Math.round(tempC);
  const summary = rainy ? `Rainy and ${rounded}°C in Davao` : `${rounded}°C in Davao`;
  return { rainy, hot, summary };
};

export function fetchWeather(): Promise<Weather | null> {
  if (cached && Date.now() - cached.at < TTL_MS) return Promise.resolve(cached.value);
  if (inFlight) return inFlight;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 5_000);

  inFlight = fetch(URL, { signal: controller.signal })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<unknown>;
    })
    .then((body) => {
      // Validate the shape before trusting external data
      const current = (body as { current?: { temperature_2m?: unknown; weather_code?: unknown } }).current;
      const temp = current?.temperature_2m;
      const code = current?.weather_code;
      if (typeof temp !== 'number' || typeof code !== 'number') throw new Error('unexpected response shape');
      const value = describe(temp, code);
      cached = { at: Date.now(), value };
      return value;
    })
    .catch((error: unknown) => {
      if (!warned) {
        console.warn('Haraya: weather unavailable, ranking without it', error);
        warned = true;
      }
      cached = { at: Date.now(), value: null };
      return null;
    })
    .finally(() => {
      window.clearTimeout(timer);
      inFlight = null;
    });

  return inFlight;
}
