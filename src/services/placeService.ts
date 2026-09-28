import { supabase } from '../config/supabase';
import type { Cafe } from '../types/coffee';
import { catalogService } from './catalogService';
import { sessionService } from './sessionService';
import {
  cafeRowToCafe,
  describePlaceError,
  toApplicationInsertRow,
  toCafeUpdateRow,
  validateListing,
  validatePlaceApplication,
  type CafeRow,
  type ListingInput,
  type PlaceApplicationInput,
  type PlaceApplicationRow,
} from './placeMapping';

/**
 * Public listings (table cafes) and Place Portal applications (table place_applications). Listings are
 * public and feed the catalog like community spots do; applications are visible to their owner and to
 * admins, as Row Level Security decides. Approved listings are cached so the map has them before the
 * network answers.
 */

const CACHE_KEY = 'haraya_listed_cafes';

const listeners = new Set<() => void>();
let version = 0;
let started = false;
let lastUserId: string | null = null;
let listings: CafeRow[] = [];
let applications: PlaceApplicationRow[] = [];
let loadError: string | null = null;

function notify(): void {
  version += 1;
  listeners.forEach((listener) => listener());
}

function readCache(): CafeRow[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CafeRow[]) : [];
  } catch {
    return [];
  }
}

function writeCache(rows: CafeRow[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
  } catch (error) {
    console.warn('Haraya: could not cache listings', error);
  }
}

function publishToCatalog(): void {
  catalogService.setListedCafes(listings.map(cafeRowToCafe));
}

export const placeService = {
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

  getLoadError(): string | null {
    return loadError;
  },

  /** True for a cafe that comes from the cafes table (not curated, community or browser-only records). */
  isListed(cafeId: string): boolean {
    return listings.some((row) => row.id === cafeId);
  },

  /** Idempotent: shows cached listings at once, then loads from Supabase and follows sign-in changes. */
  async start(): Promise<void> {
    if (started) return;
    started = true;
    listings = readCache();
    publishToCatalog();
    if (!supabase) return;
    lastUserId = sessionService.getUser()?.id ?? null;
    sessionService.subscribe(() => {
      const userId = sessionService.getUser()?.id ?? null;
      if (userId === lastUserId) return;
      lastUserId = userId;
      void placeService.refresh();
    });
    await placeService.refresh();
  },

  async refresh(): Promise<void> {
    if (!supabase) return;
    const user = sessionService.getUser();
    const [cafesResult, applicationsResult] = await Promise.all([
      supabase.from('cafes').select('*').order('created_at', { ascending: false }).limit(500),
      user
        ? supabase.from('place_applications').select('*').order('created_at', { ascending: false }).limit(500)
        : Promise.resolve({ data: [] as PlaceApplicationRow[], error: null }),
    ]);
    if (cafesResult.error) {
      loadError = 'Listings could not be loaded right now.';
      console.warn('Haraya: could not load listings', cafesResult.error.message);
    } else {
      loadError = null;
      listings = (cafesResult.data ?? []) as CafeRow[];
      writeCache(listings);
      publishToCatalog();
    }
    if (applicationsResult.error) {
      console.warn('Haraya: could not load place applications', applicationsResult.error.message);
      applications = [];
    } else {
      applications = (applicationsResult.data ?? []) as PlaceApplicationRow[];
    }
    notify();
  },

  // Owner side ------------------------------------------------------------------------------------------

  /** The signed-in visitor's latest application, if any. */
  getMyApplication(): PlaceApplicationRow | null {
    const user = sessionService.getUser();
    if (!user) return null;
    return applications.find((row) => row.owner_id === user.id) ?? null;
  },

  /** The listing the signed-in owner manages, from the shared catalog. */
  getMyCafe(): Cafe | null {
    const profile = sessionService.getProfile();
    if (!profile?.cafe_profile_id) return null;
    return catalogService.getCafeById(profile.cafe_profile_id) ?? null;
  },

  async submitApplication(input: PlaceApplicationInput): Promise<void> {
    if (!supabase) throw new Error('The Place Portal is not available right now.');
    if (!sessionService.getUser()) throw new Error('Sign in to apply.');
    const problem = validatePlaceApplication(input);
    if (problem) throw new Error(problem);
    const { error } = await supabase.from('place_applications').insert(toApplicationInsertRow(input));
    if (error) {
      console.warn('Haraya: application failed', error.message);
      throw new Error(describePlaceError(error.message));
    }
    await placeService.refresh();
  },

  async updateMyListing(input: ListingInput): Promise<void> {
    if (!supabase) throw new Error('The Place Portal is not available right now.');
    const profile = sessionService.getProfile();
    if (!profile?.cafe_profile_id) throw new Error('This account has no listing to edit yet.');
    const problem = validateListing(input);
    if (problem) throw new Error(problem);
    const { error } = await supabase.from('cafes').update(toCafeUpdateRow(input)).eq('id', profile.cafe_profile_id);
    if (error) {
      console.warn('Haraya: listing update failed', error.message);
      throw new Error(describePlaceError(error.message));
    }
    await placeService.refresh();
  },

  // Admin side ------------------------------------------------------------------------------------------

  /** Every application, pending first, newest first within a status. Empty unless the caller is an admin. */
  getApplications(): PlaceApplicationRow[] {
    if (!sessionService.isAdmin()) return [];
    const rank = { pending: 0, rejected: 1, approved: 2 } as const;
    return [...applications].sort((a, b) => rank[a.status] - rank[b.status] || b.created_at.localeCompare(a.created_at));
  },

  getPendingApplications(): PlaceApplicationRow[] {
    return placeService.getApplications().filter((row) => row.status === 'pending');
  },

  async reviewApplication(id: string, status: 'approved' | 'rejected', note: string): Promise<void> {
    if (!supabase || !sessionService.isAdmin()) throw new Error('Only admins can review applications.');
    const { error } = await supabase.rpc('admin_review_place_application', { target: id, new_status: status, note });
    if (error) {
      console.warn('Haraya: application review failed', error.message);
      throw new Error(describePlaceError(error.message));
    }
    await placeService.refresh();
    // The reviewer might be the applicant on a test account; keep their own role current
    await sessionService.refreshProfile();
  },

  async setVerified(cafeId: string, verified: boolean): Promise<void> {
    if (!supabase || !sessionService.isAdmin()) throw new Error('Only admins can verify places.');
    const { error } = await supabase.rpc('admin_set_cafe_verified', { target: cafeId, is_verified: verified });
    if (error) {
      console.warn('Haraya: verification update failed', error.message);
      throw new Error(describePlaceError(error.message));
    }
    await placeService.refresh();
  },
};
