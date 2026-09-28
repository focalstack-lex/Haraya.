import { MUST_HAVES, type MustHaveId } from './moods';

/** Remembers the last chosen must-haves. Storage can throw or hold stale values, so reads validate. */
const KEY = 'haraya_mood_prefs';
const VALID = new Set<string>(MUST_HAVES.map((item) => item.id));

export const loadMoodPrefs = (): MustHaveId[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed.filter((id) => typeof id === 'string' && VALID.has(id)) as MustHaveId[]) : [];
  } catch {
    return [];
  }
};

export const saveMoodPrefs = (ids: MustHaveId[]): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch (error) {
    console.warn('Haraya: could not remember mood finder choices', error);
  }
};
