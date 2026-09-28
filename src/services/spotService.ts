import type { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { catalogService } from './catalogService';
import { sessionService } from './sessionService';
import {
  describeSubmitError,
  rowToCafe,
  toInsertRow,
  validateSpotInput,
  type SpotInput,
  type SpotRow,
} from './spotMapping';

/**
 * Add a Spot backed by Supabase (table spot_submissions). Row Level Security decides what each caller can
 * read: everyone gets approved spots, contributors also get their own, admins get all. This service keeps
 * the latest rows in memory, feeds approved spots plus the visitor's own pending ones into the catalog,
 * and caches approved spots so the map has them before the network answers. The signed-in user comes
 * from sessionService.
 */

const CACHE_KEY = 'haraya_community_cafes';
/** Tab the app returns to after a one-time sign-in link sent from Add a Spot. */
const SUBMIT_RETURN_TAB = 'submit';

const listeners = new Set<() => void>();
let version = 0;
let started = false;
let lastUserId: string | null = null;
let rows: SpotRow[] = [];
let loadError: string | null = null;

function notify(): void {
  version += 1;
  listeners.forEach((listener) => listener());
}

function readCache(): SpotRow[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as SpotRow[]) : [];
  } catch {
    return [];
  }
}

function writeCache(approved: SpotRow[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(approved));
  } catch (error) {
    console.warn('Haraya: could not cache community spots', error);
  }
}

/** Approved spots for everyone, plus the signed-in visitor's own pending spots. */
function publishToCatalog(): void {
  const user = sessionService.getUser();
  const visible = rows.filter((row) => row.status === 'approved' || (user && row.submitted_by === user.id));
  catalogService.setCommunitySpots(
    visible.map(rowToCafe).filter((cafe): cafe is NonNullable<typeof cafe> => cafe !== null)
  );
}

export const spotService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getVersion(): number {
    return version;
  },

  isAvailable(): boolean {
    return supabase !== null;
  },

  getUser(): User | null {
    return sessionService.getUser();
  },

  isAdmin(): boolean {
    return sessionService.isAdmin();
  },

  getLoadError(): string | null {
    return loadError;
  },

  /** Idempotent: shows cached spots at once, then loads from Supabase and follows sign-in changes. */
  async start(): Promise<void> {
    if (started) return;
    started = true;
    rows = readCache();
    publishToCatalog();
    if (!supabase) return;
    lastUserId = sessionService.getUser()?.id ?? null;
    sessionService.subscribe(() => {
      const userId = sessionService.getUser()?.id ?? null;
      if (userId === lastUserId) return;
      lastUserId = userId;
      void spotService.refresh();
    });
    await spotService.refresh();
  },

  async refresh(): Promise<void> {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('spot_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      loadError = 'Community spots could not be loaded right now.';
      console.warn('Haraya: could not load community spots', error.message);
      notify();
      return;
    }
    loadError = null;
    rows = (data ?? []) as SpotRow[];
    writeCache(rows.filter((row) => row.status === 'approved'));
    publishToCatalog();
    notify();
  },

  /** Sends a one-time sign-in link. After it is opened, the app returns to Add a Spot. */
  async sendSignInLink(email: string): Promise<void> {
    if (!supabase) throw new Error('Adding spots is not available right now.');
    await sessionService.sendMagicLink(email, SUBMIT_RETURN_TAB);
  },

  async signOut(): Promise<void> {
    await sessionService.signOut();
  },

  async submit(input: SpotInput): Promise<void> {
    if (!supabase) throw new Error('Adding spots is not available right now.');
    if (!sessionService.getUser()) throw new Error('Sign in to add a spot.');
    const problem = validateSpotInput(input);
    if (problem) throw new Error(problem);
    const { error } = await supabase.from('spot_submissions').insert(toInsertRow(input));
    if (error) {
      console.warn('Haraya: spot submission failed', error.message);
      throw new Error(describeSubmitError(error.message));
    }
    await spotService.refresh();
  },

  getMySubmissions(): SpotRow[] {
    const user = sessionService.getUser();
    return user ? rows.filter((row) => row.submitted_by === user.id) : [];
  },

  getReviewQueue(): SpotRow[] {
    return sessionService.isAdmin() ? rows.filter((row) => row.status === 'pending') : [];
  },

  async review(id: string, status: 'approved' | 'rejected', note: string): Promise<void> {
    if (!supabase || !sessionService.isAdmin()) throw new Error('Only admins can review spots.');
    const { error } = await supabase.rpc('admin_review_submission', { target: id, new_status: status, note });
    if (error) {
      console.warn('Haraya: review failed', error.message);
      throw new Error('Could not save the review. Try again.');
    }
    await spotService.refresh();
  },
};
