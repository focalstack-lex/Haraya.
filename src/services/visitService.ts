import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { sessionService } from './sessionService';
import {
  computePassportStats,
  describeVisitError,
  inputToLocalVisit,
  isMissingTableError,
  mergeVisits,
  rowToVisit,
  toInsertRow,
  validateVisitInput,
  visitsInLastDay,
  VISIT_COLUMNS,
  VISIT_LIMITS,
  type PassportStats,
  type Visit,
  type VisitInput,
  type VisitRow,
} from './visitMapping';

/**
 * The sanctuary ledger. Local first: every visit is written to this device (localStorage) so the diary and
 * passport work signed out and before the sanctuary_visits migration is live. Signed in, visits are also
 * inserted into Supabase, where Row Level Security, the rate limit and the clink counter are enforced, and
 * the account's visits load from there on any device. Community reads (a cafe's recent public sessions,
 * Cup Clinks) are Supabase only and fall back to empty when it is unreachable, so no screen depends on it.
 */

const LOCAL_KEY = 'haraya_visits';

const listeners = new Set<() => void>();
let version = 0;
let started = false;
let lastUserId: string | null = null;
let localVisits: Visit[] = [];
let remoteOwn: Visit[] = [];
/** Remote tables missing (migration not applied): stop asking until the next load. */
let remoteMissing = false;
const cafeVisits = new Map<string, Visit[]>();
const cafeLoading = new Set<string>();
const myClinks = new Set<string>();
let passportPublicOverride: boolean | null = null;

function notify(): void {
  version += 1;
  listeners.forEach((listener) => listener());
}

function isVisit(value: unknown): value is Visit {
  const v = value as Visit;
  return Boolean(v) && typeof v.id === 'string' && typeof v.cafeId === 'string' && typeof v.createdAt === 'string'
    && typeof v.durationMinutes === 'number';
}

function readLocal(): Visit[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isVisit) : [];
  } catch (error) {
    console.warn('Haraya: could not read the visit ledger', error);
    return [];
  }
}

function writeLocal(): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(localVisits));
  } catch (error) {
    console.warn('Haraya: could not store the visit ledger', error);
  }
}

function makeLocalId(): string {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Query helpers take the client as a parameter so tests can pass a stub ----------------------------------

export async function fetchOwnVisits(client: SupabaseClient, userId: string) {
  return client
    .from('sanctuary_visits')
    .select(VISIT_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(300);
}

export async function fetchCafeVisits(client: SupabaseClient, cafeId: string) {
  return client
    .from('sanctuary_visits')
    .select(VISIT_COLUMNS)
    .eq('cafe_id', cafeId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(20);
}

export async function insertVisitRow(client: SupabaseClient, row: ReturnType<typeof toInsertRow>) {
  return client.from('sanctuary_visits').insert(row).select(VISIT_COLUMNS).single();
}

// ---------------------------------------------------------------------------------------------------------

/** Visits this device holds for whoever is signed in now (or for signed-out use). */
function localForCurrentUser(): Visit[] {
  const userId = sessionService.getUser()?.id ?? null;
  return localVisits.filter((visit) => visit.userId === userId || visit.userId === null);
}

async function loadOwnRemote(): Promise<void> {
  const user = sessionService.getUser();
  if (!supabase || !user) {
    remoteOwn = [];
    return;
  }
  const { data, error } = await fetchOwnVisits(supabase, user.id);
  if (error) {
    remoteMissing = isMissingTableError(error);
    if (!remoteMissing) console.warn('Haraya: could not load your visits', error.message);
    return;
  }
  remoteMissing = false;
  remoteOwn = ((data ?? []) as VisitRow[]).map(rowToVisit);
}

export interface RecordResult {
  visit: Visit;
  /** True when the visit reached the database; false when it is kept on this device only. */
  synced: boolean;
}

export const visitService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getVersion(): number {
    return version;
  },

  /** Idempotent: reads the device ledger, then follows sign-in changes to load the account's visits. */
  async start(): Promise<void> {
    if (started) return;
    started = true;
    localVisits = readLocal();
    notify();
    lastUserId = sessionService.getUser()?.id ?? null;
    sessionService.subscribe(() => {
      const userId = sessionService.getUser()?.id ?? null;
      if (userId === lastUserId) return;
      lastUserId = userId;
      passportPublicOverride = null;
      myClinks.clear();
      void visitService.refresh();
    });
    await visitService.refresh();
  },

  async refresh(): Promise<void> {
    await loadOwnRemote();
    notify();
  },

  /** The signed-in (or signed-out) user's own visits, newest first. */
  getUserVisits(): Visit[] {
    return mergeVisits(localForCurrentUser(), remoteOwn);
  },

  getPassportStats(): PassportStats {
    return computePassportStats(visitService.getUserVisits());
  },

  /** Signed in and the database has the sanctuary tables. */
  isCommunityAvailable(): boolean {
    return supabase !== null && !remoteMissing;
  },

  async recordVisit(input: VisitInput): Promise<RecordResult> {
    const problem = validateVisitInput(input);
    if (problem) throw new Error(problem);
    if (visitsInLastDay(visitService.getUserVisits(), new Date()) >= VISIT_LIMITS.dailyVisits) {
      throw new Error('You can log up to 6 visits a day. Try again tomorrow.');
    }

    const user = sessionService.getUser();
    const name = user ? sessionService.getDisplayName() || 'You' : 'You';

    if (supabase && user && !remoteMissing) {
      const { data, error } = await insertVisitRow(supabase, toInsertRow(input));
      if (!error && data) {
        const visit = rowToVisit(data as VisitRow);
        remoteOwn = mergeVisits([], [visit, ...remoteOwn]);
        localVisits = [visit, ...localVisits.filter((entry) => entry.id !== visit.id)];
        writeLocal();
        notify();
        return { visit, synced: true };
      }
      if (error && !isMissingTableError(error) && !/fetch|network/i.test(error.message)) {
        console.warn('Haraya: visit insert failed', error.message);
        throw new Error(describeVisitError(error.message));
      }
      if (error && isMissingTableError(error)) remoteMissing = true;
    }

    // Signed out, offline, or the migration is not applied yet: keep it on this device.
    const visit = inputToLocalVisit(input, makeLocalId(), user?.id ?? null, name, new Date());
    localVisits = [visit, ...localVisits];
    writeLocal();
    notify();
    return { visit, synced: false };
  },

  // Community ------------------------------------------------------------------------------------------

  /** Recent public sessions at a cafe plus the viewer's own visits there; empty until loaded. */
  getCafeVisits(cafeId: string): Visit[] {
    const own = visitService.getUserVisits().filter((visit) => visit.cafeId === cafeId);
    return mergeVisits(own, cafeVisits.get(cafeId) ?? []).slice(0, 12);
  },

  isCafeLoading(cafeId: string): boolean {
    return cafeLoading.has(cafeId);
  },

  async loadCafeVisits(cafeId: string): Promise<void> {
    if (!supabase || remoteMissing || cafeLoading.has(cafeId)) return;
    cafeLoading.add(cafeId);
    notify();
    try {
      const { data, error } = await fetchCafeVisits(supabase, cafeId);
      if (error) {
        remoteMissing = isMissingTableError(error);
        if (!remoteMissing) console.warn('Haraya: could not load visits for this spot', error.message);
        return;
      }
      const visits = ((data ?? []) as VisitRow[]).map(rowToVisit);
      cafeVisits.set(cafeId, visits);
      const user = sessionService.getUser();
      if (user && visits.length > 0) {
        const { data: clinks, error: clinkError } = await supabase
          .from('cup_clinks')
          .select('visit_id')
          .eq('user_id', user.id)
          .in('visit_id', visits.map((visit) => visit.id));
        if (clinkError) console.warn('Haraya: could not load your clinks', clinkError.message);
        for (const row of (clinks ?? []) as { visit_id: string }[]) myClinks.add(row.visit_id);
      }
    } finally {
      cafeLoading.delete(cafeId);
      notify();
    }
  },

  hasClinked(visitId: string): boolean {
    return myClinks.has(visitId);
  },

  /** Why the viewer cannot clink this visit, or null when they can. */
  clinkBlocker(visit: Visit): string | null {
    const user = sessionService.getUser();
    if (!supabase || remoteMissing) return 'Cup Clinks are not available yet.';
    if (!user) return 'Sign in to send a Cup Clink.';
    if (visit.userId === user.id) return 'That is your own session.';
    if (!visit.synced || !visit.isPublic) return 'Only public sessions can be clinked.';
    return null;
  },

  /** Adds or removes the viewer's clink with an optimistic count; reverts if the database refuses. */
  async toggleCupClink(visit: Visit): Promise<void> {
    const blocker = visitService.clinkBlocker(visit);
    if (blocker) throw new Error(blocker);
    const client = supabase as SupabaseClient;
    const userId = sessionService.getUser()?.id as string;
    const clinked = myClinks.has(visit.id);
    const adjust = (delta: number) => {
      const list = cafeVisits.get(visit.cafeId);
      if (list) {
        cafeVisits.set(
          visit.cafeId,
          list.map((entry) => (entry.id === visit.id ? { ...entry, clinksCount: Math.max(0, entry.clinksCount + delta) } : entry))
        );
      }
    };

    if (clinked) myClinks.delete(visit.id);
    else myClinks.add(visit.id);
    adjust(clinked ? -1 : 1);
    notify();

    const { error } = clinked
      ? await client.from('cup_clinks').delete().eq('visit_id', visit.id).eq('user_id', userId)
      : await client.from('cup_clinks').insert({ visit_id: visit.id, user_id: userId });
    if (error) {
      console.warn('Haraya: Cup Clink failed', error.message);
      if (clinked) myClinks.add(visit.id);
      else myClinks.delete(visit.id);
      adjust(clinked ? 1 : -1);
      notify();
      throw new Error('Could not send the Cup Clink. Try again.');
    }
  },

  // Privacy --------------------------------------------------------------------------------------------

  /** Whether the signed-in passport is public. Defaults to public, as the database column does. */
  isPassportPublic(): boolean {
    if (passportPublicOverride !== null) return passportPublicOverride;
    return sessionService.getProfile()?.is_public_passport ?? true;
  },

  async setPassportPublic(value: boolean): Promise<void> {
    const user = sessionService.getUser();
    if (!supabase || !user) throw new Error('Sign in to change passport privacy.');
    const previous = visitService.isPassportPublic();
    passportPublicOverride = value;
    notify();
    const { error } = await supabase.from('profiles').update({ is_public_passport: value }).eq('id', user.id);
    if (error) {
      passportPublicOverride = previous;
      notify();
      console.warn('Haraya: passport privacy update failed', error.message);
      throw new Error(
        isMissingTableError(error) || /column/i.test(error.message)
          ? 'Passport privacy is not available yet.'
          : 'Could not change passport privacy. Try again.'
      );
    }
  },
};
