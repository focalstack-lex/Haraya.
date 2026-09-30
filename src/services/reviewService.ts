import { supabase } from '../config/supabase';
import { sessionService } from './sessionService';

/**
 * Public reviews of a spot (table spot_reviews, 20260930020000): a star rating with optional words, one per
 * account per spot. Signed-out visitors keep their rating on the device only, as before.
 */

export const REVIEW_BODY_LIMIT = 600;

export interface SpotReview {
  id: string;
  /** Absent for signed-out readers, who are not given account ids. */
  user_id?: string;
  cafe_id: string;
  rating: number;
  body: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

const listeners = new Set<() => void>();
let version = 0;
const byCafe = new Map<string, SpotReview[]>();
let unavailable = false;

function notify(): void {
  version += 1;
  listeners.forEach((listener) => listener());
}

const isMissing = (message: string): boolean => /schema cache|does not exist|Could not find/i.test(message);

function describe(message: string): string {
  if (message.includes('review_limit')) return 'You can post up to 20 reviews a day.';
  if (message.includes('account_suspended')) return 'This account is restricted and cannot post right now.';
  if (isMissing(message)) return 'Public reviews need the latest database update, which is not applied yet.';
  return 'Could not save the review. Try again.';
}

export const reviewService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getVersion(): number {
    return version;
  },

  /** True when a signed-in visitor can post a public review. */
  canPost(): boolean {
    return supabase !== null && !unavailable && sessionService.getUser() !== null;
  },

  getReviews(cafeId: string): SpotReview[] {
    return byCafe.get(cafeId) ?? [];
  },

  getAverage(cafeId: string): { average: number; count: number } | null {
    const reviews = reviewService.getReviews(cafeId);
    if (reviews.length === 0) return null;
    return { average: reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length, count: reviews.length };
  },

  async load(cafeId: string): Promise<void> {
    if (!supabase || unavailable) return;
    const columns = sessionService.getUser()
      ? 'id, user_id, cafe_id, rating, body, author_name, created_at, updated_at'
      : 'id, cafe_id, rating, body, author_name, created_at, updated_at';
    const { data, error } = await supabase.from('spot_reviews').select(columns).eq('cafe_id', cafeId).order('created_at', { ascending: false }).limit(50);
    if (error) {
      if (isMissing(error.message)) unavailable = true;
      else console.warn('Haraya: could not load reviews', error.message);
      return;
    }
    byCafe.set(cafeId, (data ?? []) as unknown as SpotReview[]);
    notify();
  },

  /** Posts or replaces the signed-in visitor's review of a spot. */
  async save(cafeId: string, rating: number, body: string): Promise<void> {
    const user = sessionService.getUser();
    if (!supabase || !user) throw new Error('Sign in to post a review.');
    const text = body.trim();
    if (text.length > REVIEW_BODY_LIMIT) throw new Error(`Keep the review under ${REVIEW_BODY_LIMIT} characters.`);
    const existing = await supabase.from('spot_reviews').select('id').eq('cafe_id', cafeId).eq('user_id', user.id).maybeSingle();
    if (existing.error) {
      if (isMissing(existing.error.message)) unavailable = true;
      throw new Error(describe(existing.error.message));
    }
    const { error } = existing.data
      ? await supabase.from('spot_reviews').update({ rating, body: text }).eq('id', existing.data.id)
      : await supabase.from('spot_reviews').insert({ cafe_id: cafeId, rating, body: text });
    if (error) {
      console.warn('Haraya: review failed', error.message);
      throw new Error(describe(error.message));
    }
    await reviewService.load(cafeId);
  },

  /** Removes the signed-in visitor's review of a spot, if there is one. */
  async removeMine(cafeId: string): Promise<void> {
    const user = sessionService.getUser();
    if (!supabase || !user || unavailable) return;
    const { error } = await supabase.from('spot_reviews').delete().eq('cafe_id', cafeId).eq('user_id', user.id);
    if (error) {
      console.warn('Haraya: review removal failed', error.message);
      return;
    }
    await reviewService.load(cafeId);
  },
};
