import { DAVAO_DISTRICTS, type District } from '../../types/coffee';
import type { MoodId, MoodRequest, MustHaveId } from './moods';

/**
 * Deterministic reading of a typed request ("quiet place to study, not too pricey, near Matina").
 * Phrases match whole words, case-insensitively. When several moods appear, the earliest one in
 * the sentence wins. This is the part a hosted AI model can replace later (see interpretRequest).
 */

const MOOD_PHRASES: Record<MoodId, string[]> = {
  focused: ['study', 'studying', 'thesis', 'work', 'working', 'laptop', 'focus', 'focused', 'deadline', 'review', 'productive', 'remote'],
  cozy: ['cozy', 'cosy', 'chill', 'relax', 'relaxing', 'rainy', 'rain', 'date', 'read', 'reading', 'book'],
  social: ['friends', 'barkada', 'hang out', 'hangout', 'catch up', 'group', 'meetup', 'meet up'],
  treat: ['treat', 'fancy', 'special', 'splurge', 'celebrate', 'tasting', 'specialty'],
  quick: ['quick', 'fast', 'on the way', 'grab', 'takeout', 'take out', 'to go'],
  explore: ['explore', 'discover', 'something new', 'try something', 'roastery', 'roasteries', 'adventure'],
};

const MUST_HAVE_PHRASES: Record<MustHaveId, string[]> = {
  pets: ['dog', 'dogs', 'cat', 'cats', 'pet', 'pets', 'pet-friendly', 'fur baby', 'furbaby'],
  wifi: ['wifi', 'wi-fi', 'internet', 'online'],
  quiet: ['quiet', 'silent', 'peaceful', 'calm'],
  plugs: ['plug', 'plugs', 'outlet', 'outlets', 'socket', 'charge', 'charging'],
  aircon: ['aircon', 'air-con', 'airconditioned', 'air conditioned', 'air conditioning'],
  outdoor: ['outdoor', 'outdoors', 'outside', 'garden', 'al fresco', 'fresh air'],
  openNow: ['open now', 'right now', 'currently open'],
  pourOver: ['pour over', 'pour-over', 'pourover', 'v60', 'hand brew', 'hand-brew', 'filter coffee'],
  oatMilk: ['oat milk', 'oatmilk', 'oat', 'vegan', 'dairy-free', 'dairy free', 'lactose'],
};

// Mid-price phrases are checked first so "not too pricey" never reads as budget
const MID_PRICE = ['not too pricey', 'not too expensive', 'moderate', 'reasonable', 'mid-range', 'mid range'];
const BUDGET_PRICE = ['cheap', 'budget', 'affordable', 'inexpensive', 'mura', 'barato', 'student'];

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Whole-word, case-insensitive matcher; spaces in a phrase match any run of whitespace. */
const phraseRegex = (phrase: string) =>
  new RegExp(`(?<![\\w-])${escape(phrase).replace(/\s+/g, '\\s+')}(?![\\w-])`, 'i');

const firstIndex = (text: string, phrases: string[]): number => {
  let best = -1;
  for (const phrase of phrases) {
    const match = phraseRegex(phrase).exec(text);
    if (match && (best === -1 || match.index < best)) best = match.index;
  }
  return best;
};

export function parseQuery(text: string): Partial<MoodRequest> {
  const input = text.trim();
  if (!input) return {};
  const result: Partial<MoodRequest> = {};

  let moodAt = -1;
  for (const [mood, phrases] of Object.entries(MOOD_PHRASES) as [MoodId, string[]][]) {
    const at = firstIndex(input, phrases);
    if (at !== -1 && (moodAt === -1 || at < moodAt)) {
      moodAt = at;
      result.mood = mood;
    }
  }

  const mustHaves = (Object.entries(MUST_HAVE_PHRASES) as [MustHaveId, string[]][])
    .filter(([, phrases]) => firstIndex(input, phrases) !== -1)
    .map(([id]) => id);
  if (mustHaves.length > 0) result.mustHaves = mustHaves;

  if (firstIndex(input, MID_PRICE) !== -1) result.maxPrice = 2;
  else if (firstIndex(input, BUDGET_PRICE) !== -1) result.maxPrice = 1;

  const district = DAVAO_DISTRICTS.find((name) => phraseRegex(name).test(input));
  if (district) result.district = district as District;

  return result;
}

/**
 * The seam for a future hosted model: same input, same output shape. Today it runs the local parser,
 * so it never fails and never sends the text anywhere.
 */
export async function interpretRequest(text: string): Promise<Partial<MoodRequest>> {
  return parseQuery(text);
}
