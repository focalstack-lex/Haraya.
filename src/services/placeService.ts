import { supabase } from '../config/supabase';
import type { Cafe } from '../types/coffee';
import { catalogService } from './catalogService';
import { sessionService } from './sessionService';
import {
  cafeRowToCafe,
  describePlaceError,
  toApplicationInsertRow,
  toCafeCreatePayload,
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
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    // A damaged or hand-edited cache is dropped rather than rendered
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row): row is CafeRow => Boolean(row) && typeof row === 'object' && 'id' in row && 'name' in row);
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
  const hidden = new Set(listings.filter((row) => row.status === 'hidden').map((row) => row.id));
  catalogService.setListedCafes(listings.filter((row) => row.status !== 'hidden').map(cafeRowToCafe), hidden);
}

/** True once the photo, announcement and status columns exist (20260930020000 applied). */
const isExtended = (): boolean => listings.some((row) => row.status !== undefined);

export type ListingStatus = 'listed' | 'hidden' | 'closed';

export interface ListingStats {
  visitsTotal: number;
  visits30d: number;
  focusMinutes30d: number;
  reviewsTotal: number;
  ratingAverage: number | null;
}

const PHOTO_BUCKET = 'place-photos';
const PHOTO_MAX_EDGE = 1600;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Shrinks a photo in the browser so a phone camera shot uploads as a small JPEG. */
async function shrinkPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot prepare the photo.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('This browser cannot prepare the photo.'))), 'image/jpeg', 0.82);
  });
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

  /** One row of the cafes table as a Cafe, hidden ones included, so an admin can still edit a hidden listing. */
  getListingAsCafe(cafeId: string): Cafe | null {
    const row = listings.find((entry) => entry.id === cafeId);
    return row ? cafeRowToCafe(row) : null;
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
    const profile = sessionService.getProfile();
    if (!profile?.cafe_profile_id) throw new Error('This account has no listing to edit yet.');
    await placeService.updateListing(profile.cafe_profile_id, input);
  },

  /** Saves a listing. Row Level Security allows it for that listing's owner and for admins. */
  async updateListing(cafeId: string, input: ListingInput): Promise<void> {
    if (!supabase) throw new Error('The Place Portal is not available right now.');
    const problem = validateListing(input);
    if (problem) throw new Error(problem);
    const { error } = await supabase.from('cafes').update(toCafeUpdateRow(input, isExtended())).eq('id', cafeId);
    if (error) {
      console.warn('Haraya: listing update failed', error.message);
      throw new Error(describePlaceError(error.message));
    }
    await placeService.refresh();
  },

  /** True when photos and announcements can be saved (the latest database update is applied). */
  supportsPhotos(): boolean {
    return isExtended();
  },

  /** Uploads one photo for a listing and returns its public link. The caller adds it to the listing and saves. */
  async uploadPhoto(cafeId: string, file: File): Promise<string> {
    if (!supabase) throw new Error('Photo upload is not available right now.');
    if (!PHOTO_TYPES.includes(file.type)) throw new Error('Use a JPEG, PNG or WebP photo.');
    if (file.size > 12 * 1024 * 1024) throw new Error('That photo is too large. Pick one under 12 MB.');
    const blob = await shrinkPhoto(file);
    const path = `${cafeId}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
    if (error) {
      console.warn('Haraya: photo upload failed', error.message);
      throw new Error(/bucket|not found/i.test(error.message) ? 'Photo upload needs the latest database update, which is not applied yet.' : 'Could not upload the photo. Try again.');
    }
    return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  },

  /** Check-ins and reviews for a listing; its owner and admins only. Null when it cannot be read. */
  async getStats(cafeId: string): Promise<ListingStats | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc('listing_stats', { target: cafeId });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) {
      if (error) console.warn('Haraya: listing stats failed', error.message);
      return null;
    }
    return {
      visitsTotal: Number(row.visits_total) || 0,
      visits30d: Number(row.visits_30d) || 0,
      focusMinutes30d: Number(row.focus_minutes_30d) || 0,
      reviewsTotal: Number(row.reviews_total) || 0,
      ratingAverage: row.rating_average === null || row.rating_average === undefined ? null : Number(row.rating_average),
    };
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

  /** Every row of the cafes table, hidden ones included, for the Control Room. Empty unless the caller is an admin. */
  getAllListingRows(): CafeRow[] {
    return sessionService.isAdmin() ? listings : [];
  },

  /** Adds a place straight to the catalog, unverified until an admin verifies it. Returns the new id. */
  async createListing(input: ListingInput): Promise<string> {
    if (!supabase || !sessionService.isAdmin()) throw new Error('Only admins can add places.');
    const problem = validateListing(input);
    if (problem) throw new Error(problem);
    const { data, error } = await supabase.rpc('admin_create_cafe', { payload: toCafeCreatePayload(input), is_verified: false });
    if (error) {
      console.warn('Haraya: place creation failed', error.message);
      throw new Error(describePlaceError(error.message));
    }
    await placeService.refresh();
    return String(data);
  },

  /** Adds many places at once. All or nothing: the database cancels the import on the first bad row. */
  async importListings(inputs: ListingInput[]): Promise<number> {
    if (!supabase || !sessionService.isAdmin()) throw new Error('Only admins can import places.');
    const { data, error } = await supabase.rpc('admin_import_cafes', { places: inputs.map(toCafeCreatePayload) });
    if (error) {
      console.warn('Haraya: import failed', error.message);
      throw new Error(describePlaceError(error.message));
    }
    await placeService.refresh();
    return Number(data) || 0;
  },

  /** Listed shows the place, hidden takes it off the app, closed keeps it findable as shut for good. */
  async setStatus(cafeId: string, status: ListingStatus): Promise<void> {
    if (!supabase || !sessionService.isAdmin()) throw new Error('Only admins can change a listing.');
    const { error } = await supabase.rpc('admin_set_cafe_status', { target: cafeId, new_status: status });
    if (error) {
      console.warn('Haraya: status change failed', error.message);
      throw new Error(describePlaceError(error.message));
    }
    await placeService.refresh();
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
