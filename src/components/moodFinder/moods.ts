import type { District } from '../../types/coffee';

/** Moods rank cafes softly; must-haves filter strictly. See docs/superpowers/specs/2026-09-28-mood-finder-design.md. */
export type MoodId = 'focused' | 'cozy' | 'social' | 'treat' | 'quick' | 'explore';

export type MustHaveId = 'pets' | 'wifi' | 'quiet' | 'plugs' | 'aircon' | 'outdoor' | 'openNow' | 'pourOver' | 'oatMilk';

export interface MoodRequest {
  mood: MoodId | null;
  mustHaves: MustHaveId[];
  /** Highest price level to allow (1 budget, 2 mid, 3 premium). */
  maxPrice: 1 | 2 | 3 | null;
  district: District | null;
}

export const EMPTY_REQUEST: MoodRequest = { mood: null, mustHaves: [], maxPrice: null, district: null };

export const MOODS: { id: MoodId; label: string; hint: string }[] = [
  { id: 'focused', label: 'Focused', hint: 'Quiet, Wi-Fi, plugs, open for a while' },
  { id: 'cozy', label: 'Cozy', hint: 'Quiet corners and heritage rooms' },
  { id: 'social', label: 'Social', hint: 'Outdoor tables and late nights' },
  { id: 'treat', label: 'Treat myself', hint: 'Premium bars and pour-over' },
  { id: 'quick', label: 'Quick cup', hint: 'Nearest, open now, easy on the wallet' },
  { id: 'explore', label: 'Explore', hint: 'Roasteries you have not visited' },
];

export const MUST_HAVES: { id: MustHaveId; label: string }[] = [
  { id: 'pets', label: 'Pets' },
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'quiet', label: 'Quiet' },
  { id: 'plugs', label: 'Plugs' },
  { id: 'aircon', label: 'Air-con' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'openNow', label: 'Open now' },
  { id: 'pourOver', label: 'Pour-over' },
  { id: 'oatMilk', label: 'Oat milk' },
];

/** The Wi-Fi must-have means at least this speed. */
export const WIFI_MIN_MBPS = 25;

/** Focused sessions need at least this many minutes before closing. */
export const FOCUS_MIN_MINUTES = 120;
