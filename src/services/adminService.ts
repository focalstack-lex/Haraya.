import { supabase } from '../config/supabase';
import type { Profile, ProfileRole } from '../types/auth';
import { describePlaceError } from './placeMapping';
import { sessionService } from './sessionService';

/**
 * Control Room account management: the list of profiles (readable by admins only, per Row Level
 * Security) and role changes through admin_set_profile_role(), which the database checks again.
 */

const listeners = new Set<() => void>();
let version = 0;
let profiles: Profile[] = [];
let loadError: string | null = null;

function notify(): void {
  version += 1;
  listeners.forEach((listener) => listener());
}

export const adminService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getVersion(): number {
    return version;
  },

  getProfiles(): Profile[] {
    return sessionService.isAdmin() ? profiles : [];
  },

  getLoadError(): string | null {
    return loadError;
  },

  async refresh(): Promise<void> {
    if (!supabase || !sessionService.isAdmin()) {
      profiles = [];
      notify();
      return;
    }
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(500);
    if (error) {
      loadError = 'Accounts could not be loaded right now.';
      console.warn('Haraya: could not load profiles', error.message);
    } else {
      loadError = null;
      profiles = (data ?? []) as Profile[];
    }
    notify();
  },

  async setRole(profileId: string, role: ProfileRole): Promise<void> {
    if (!supabase || !sessionService.isAdmin()) throw new Error('Only admins can change roles.');
    const { error } = await supabase.rpc('admin_set_profile_role', { target: profileId, new_role: role });
    if (error) {
      console.warn('Haraya: role change failed', error.message);
      throw new Error(describePlaceError(error.message));
    }
    await adminService.refresh();
  },

  /** Restricts or restores an account. A restricted account can still sign in and browse, but cannot post. */
  async setSuspended(profileId: string, suspended: boolean): Promise<void> {
    if (!supabase || !sessionService.isAdmin()) throw new Error('Only admins can restrict accounts.');
    const { error } = await supabase.rpc('admin_set_profile_suspended', { target: profileId, suspended });
    if (error) {
      console.warn('Haraya: restricting the account failed', error.message);
      throw new Error(describePlaceError(error.message));
    }
    await adminService.refresh();
  },
};
