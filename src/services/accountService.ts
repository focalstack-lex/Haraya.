import { supabase } from '../config/supabase';
import { describePlaceError } from './placeMapping';
import { sessionService } from './sessionService';
import { userPrefsService } from './userPrefsService';

/**
 * The account's own data: keeping saved spots on the account so they follow the visitor to another
 * device (table saved_spots), a full export, and deleting the account (20260930020000).
 */

let syncStarted = false;
let lastUserId: string | null = null;
/** Set when saved_spots is missing (migration not applied): saves stay on the device, as before. */
let syncUnavailable = false;

const isMissing = (message: string): boolean => /schema cache|does not exist|Could not find/i.test(message);

/** Two-way merge on sign-in: nothing saved on either side is lost. */
async function mergeSaved(): Promise<void> {
  const user = sessionService.getUser();
  if (!supabase || !user || syncUnavailable) return;
  const { data, error } = await supabase.from('saved_spots').select('spot_id').limit(500);
  if (error) {
    if (isMissing(error.message)) syncUnavailable = true;
    else console.warn('Haraya: could not load saved spots', error.message);
    return;
  }
  const remote = new Set((data ?? []).map((row) => String(row.spot_id)));
  const local = userPrefsService.getSavedCafes();
  const missingRemotely = local.filter((id) => !remote.has(id));
  if (missingRemotely.length > 0) {
    const { error: pushError } = await supabase.from('saved_spots').insert(missingRemotely.map((spot_id) => ({ spot_id })));
    if (pushError) console.warn('Haraya: could not store saved spots on the account', pushError.message);
  }
  userPrefsService.addSavedCafes([...remote]);
}

export const accountService = {
  /** Idempotent: merges saved spots now and again whenever someone signs in. */
  async startSavedSync(): Promise<void> {
    if (syncStarted) return;
    syncStarted = true;
    if (!supabase) return;
    lastUserId = sessionService.getUser()?.id ?? null;
    sessionService.subscribe(() => {
      const userId = sessionService.getUser()?.id ?? null;
      if (userId === lastUserId) return;
      lastUserId = userId;
      if (userId) void mergeSaved();
    });
    await mergeSaved();
  },

  /** Mirrors one save or unsave to the account. The device copy is already updated; this is best effort. */
  async pushSaved(spotId: string, saved: boolean): Promise<void> {
    const user = sessionService.getUser();
    if (!supabase || !user || syncUnavailable) return;
    const { error } = saved
      ? await supabase.from('saved_spots').upsert({ spot_id: spotId }, { onConflict: 'user_id,spot_id', ignoreDuplicates: true })
      : await supabase.from('saved_spots').delete().eq('user_id', user.id).eq('spot_id', spotId);
    if (error) {
      if (isMissing(error.message)) syncUnavailable = true;
      else console.warn('Haraya: could not update saved spots on the account', error.message);
    }
  },

  /** Everything Haraya holds about the signed-in account, plus what is kept on this device. */
  async exportMyData(): Promise<Record<string, unknown>> {
    const user = sessionService.getUser();
    if (!supabase || !user) throw new Error('Sign in to export your data.');
    const own = async (table: string, column: string): Promise<unknown[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.from(table).select('*').eq(column, user.id).limit(1000);
      // A table that does not exist yet simply has nothing to export
      if (error && !isMissing(error.message)) console.warn(`Haraya: could not export ${table}`, error.message);
      return data ?? [];
    };
    const [profile, visits, clinks, submissions, applications, reviews, reports, saved, notifications] = await Promise.all([
      own('profiles', 'id'),
      own('sanctuary_visits', 'user_id'),
      own('cup_clinks', 'user_id'),
      own('spot_submissions', 'submitted_by'),
      own('place_applications', 'owner_id'),
      own('spot_reviews', 'user_id'),
      own('reports', 'reporter_id'),
      own('saved_spots', 'user_id'),
      own('notifications', 'user_id'),
    ]);
    return {
      exported_at: new Date().toISOString(),
      account: { id: user.id, email: user.email ?? '' },
      profile: profile[0] ?? null,
      check_ins: visits,
      cup_clinks: clinks,
      spots_you_added: submissions,
      place_applications: applications,
      reviews,
      reports,
      saved_spots: saved,
      notifications,
      on_this_device: {
        saved_spots: userPrefsService.getSavedCafes(),
        ratings: userPrefsService.getRatings(),
        lists: userPrefsService.getLists(),
      },
    };
  },

  /** Deletes the signed-in account and everything tied to it, then clears this device. Cannot be undone. */
  async deleteMyAccount(): Promise<void> {
    if (!supabase || !sessionService.getUser()) throw new Error('Sign in first.');
    const { error } = await supabase.rpc('delete_my_account');
    if (error) {
      console.warn('Haraya: account deletion failed', error.message);
      throw new Error(describePlaceError(error.message));
    }
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('haraya_')) localStorage.removeItem(key);
      }
    } catch (failure) {
      console.warn('Haraya: could not clear this device', failure);
    }
    await sessionService.signOut();
  },
};
