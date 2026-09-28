import type { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { catalogService } from './catalogService';
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
 * and caches approved spots so the map has them before the network answers.
 */

const CACHE_KEY = 'haraya_community_cafes';
const AFTER_SIGN_IN_KEY = 'haraya_after_sign_in';

const listeners = new Set<() => void>();
let version = 0;
let started = false;
let user: User | null = null;
let admin = false;
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
  const visible = rows.filter((row) => row.status === 'approved' || (user && row.submitted_by === user.id));
  catalogService.setCommunitySpots(
    visible.map(rowToCafe).filter((cafe): cafe is NonNullable<typeof cafe> => cafe !== null)
  );
}

async function refreshAdmin(): Promise<void> {
  if (!supabase || !user) {
    admin = false;
    return;
  }
  const { data, error } = await supabase.rpc('is_admin');
  if (error) {
    console.warn('Haraya: could not check the admin role', error.message);
    admin = false;
    return;
  }
  admin = data === true;
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
    return user;
  },

  isAdmin(): boolean {
    return admin;
  },

  getLoadError(): string | null {
    return loadError;
  },

  /** Idempotent: restores the session, listens for sign-in changes, and loads spots once. */
  async start(): Promise<void> {
    if (started) return;
    started = true;
    rows = readCache();
    publishToCatalog();
    if (!supabase) return;

    const { data, error } = await supabase.auth.getSession();
    if (error) console.warn('Haraya: could not restore the sign-in session', error.message);
    user = data.session?.user ?? null;
    // A magic link lands with ?code=...; the client exchanges it, then the URL is cleaned
    if (new URLSearchParams(window.location.search).has('code')) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      if (nextUser?.id === user?.id) return;
      user = nextUser;
      void refreshAdmin().then(() => spotService.refresh());
    });

    await refreshAdmin();
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
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) throw new Error('Enter a valid email address.');
    try {
      sessionStorage.setItem(AFTER_SIGN_IN_KEY, 'submit');
    } catch (error) {
      console.warn('Haraya: could not remember the return tab', error);
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: `${window.location.origin}/`, shouldCreateUser: true },
    });
    if (error) {
      console.warn('Haraya: sign-in link failed', error.message);
      throw new Error(
        /rate|too many/i.test(error.message)
          ? 'Too many sign-in emails. Wait a minute and try again.'
          : 'Could not send the sign-in link. Check the email and try again.'
      );
    }
  },

  /** The tab to open after returning from a sign-in link, read once. */
  takeReturnTab(): string | null {
    try {
      const tab = sessionStorage.getItem(AFTER_SIGN_IN_KEY);
      sessionStorage.removeItem(AFTER_SIGN_IN_KEY);
      return tab;
    } catch {
      return null;
    }
  },

  async signOut(): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.warn('Haraya: sign out failed', error.message);
    user = null;
    admin = false;
    await spotService.refresh();
  },

  async submit(input: SpotInput): Promise<void> {
    if (!supabase) throw new Error('Adding spots is not available right now.');
    if (!user) throw new Error('Sign in to add a spot.');
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
    return user ? rows.filter((row) => row.submitted_by === user?.id) : [];
  },

  getReviewQueue(): SpotRow[] {
    return admin ? rows.filter((row) => row.status === 'pending') : [];
  },

  async review(id: string, status: 'approved' | 'rejected', note: string): Promise<void> {
    if (!supabase || !admin) throw new Error('Only admins can review spots.');
    const { error } = await supabase.rpc('admin_review_submission', { target: id, new_status: status, note });
    if (error) {
      console.warn('Haraya: review failed', error.message);
      throw new Error('Could not save the review. Try again.');
    }
    await spotService.refresh();
  },
};
