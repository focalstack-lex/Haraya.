import type { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import type { PortalRole, Profile } from '../types/auth';

/**
 * The signed-in account: Supabase Auth session plus the caller's row in public.profiles (role, status,
 * owned listing). One service owns the session so Add a Spot, the Place Portal, the Control Room and the
 * profile page all see the same user. Email and password, one-time links and password resets are all
 * Supabase Auth; nothing about credentials is stored in the browser by this code.
 */

const AFTER_SIGN_IN_KEY = 'haraya_after_sign_in';
/** Return tab stored before a password-reset email so the app opens the new-password form on return. */
export const RESET_RETURN_TAB = 'reset';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN_LENGTH = 8;

const listeners = new Set<() => void>();
let version = 0;
let started = false;
let user: User | null = null;
let profile: Profile | null = null;
let recovering = false;

function notify(): void {
  version += 1;
  listeners.forEach((listener) => listener());
}

function rememberReturnTab(tab: string): void {
  try {
    sessionStorage.setItem(AFTER_SIGN_IN_KEY, tab);
  } catch (error) {
    console.warn('Haraya: could not remember the return tab', error);
  }
}

/** Friendly wording for Supabase Auth errors; the raw message goes to the console only. */
function describeAuthError(message: string, fallback: string): string {
  const text = message.toLowerCase();
  if (text.includes('invalid login credentials')) return 'Wrong email or password.';
  if (text.includes('email not confirmed')) return 'Confirm your email first: open the link we sent you, then sign in.';
  if (text.includes('already registered') || text.includes('already been registered')) {
    return 'That email already has an account. Sign in instead.';
  }
  if (text.includes('password should be') || text.includes('password is too')) {
    return `Use a password of at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (text.includes('rate') || text.includes('too many')) return 'Too many attempts. Wait a minute and try again.';
  if (text.includes('signups not allowed')) return 'New accounts are closed right now.';
  if (text.includes('same password') || text.includes('different from the old')) {
    return 'Choose a password you have not used before.';
  }
  if (text.includes('session') && text.includes('missing')) return 'Your reset link expired. Request a new one.';
  return fallback;
}

async function loadProfile(): Promise<void> {
  if (!supabase || !user) {
    profile = null;
    return;
  }
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) {
    console.warn('Haraya: could not load the profile', error.message);
    profile = null;
    return;
  }
  profile = (data as Profile | null) ?? null;
}

async function setUser(next: User | null): Promise<void> {
  user = next;
  await loadProfile();
  notify();
}

export const sessionService = {
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

  getProfile(): Profile | null {
    return profile;
  },

  /** Display name: the profile name, or the part of the email before @. */
  getDisplayName(): string {
    if (profile?.name) return profile.name;
    const email = user?.email ?? '';
    return email.includes('@') ? email.slice(0, email.indexOf('@')) : email;
  },

  isAdmin(): boolean {
    return profile?.role === 'admin';
  },

  /** An approved place owner with a listing to manage. */
  isPlaceOwner(): boolean {
    return Boolean(profile && profile.cafe_profile_id && profile.status === 'approved' && profile.role !== 'guest');
  },

  getPortalRole(): PortalRole {
    if (!user) return 'guest';
    if (profile?.role === 'admin') return 'admin';
    if (sessionService.isPlaceOwner()) return 'roaster';
    return 'user';
  },

  /** True between opening a password-reset link and choosing the new password. */
  isRecovering(): boolean {
    return recovering;
  },

  /** Idempotent: restores the session, cleans the sign-in code from the URL, and follows auth changes. */
  async start(): Promise<void> {
    if (started) return;
    started = true;
    if (!supabase) return;

    const { data, error } = await supabase.auth.getSession();
    if (error) console.warn('Haraya: could not restore the sign-in session', error.message);
    // A sign-in or reset link lands with ?code=...; the client exchanges it, then the URL is cleaned
    if (new URLSearchParams(window.location.search).has('code')) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
    }
    await setUser(data.session?.user ?? null);

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        recovering = true;
        notify();
      }
      const nextUser = session?.user ?? null;
      const changed = nextUser?.id !== user?.id || event === 'USER_UPDATED';
      // Supabase asks that other client calls run outside this callback
      if (changed) window.setTimeout(() => void setUser(nextUser), 0);
    });
  },

  async refreshProfile(): Promise<void> {
    await loadProfile();
    notify();
  },

  async signInWithPassword(email: string, password: string): Promise<void> {
    if (!supabase) throw new Error('Accounts are not available right now.');
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmed)) throw new Error('Enter a valid email address.');
    if (!password) throw new Error('Enter your password.');
    const { data, error } = await supabase.auth.signInWithPassword({ email: trimmed, password });
    if (error) {
      console.warn('Haraya: sign in failed', error.message);
      throw new Error(describeAuthError(error.message, 'Could not sign in. Check the email and password and try again.'));
    }
    await setUser(data.user);
  },

  /**
   * Creates an account. When the project requires email confirmation there is no session yet, and the
   * caller shows a "check your email" note instead.
   */
  async signUpWithPassword(email: string, password: string, name: string): Promise<{ needsConfirmation: boolean }> {
    if (!supabase) throw new Error('Accounts are not available right now.');
    const trimmed = email.trim().toLowerCase();
    const displayName = name.trim();
    if (!displayName) throw new Error('Add your name.');
    if (displayName.length > 80) throw new Error('Keep your name under 80 characters.');
    if (!EMAIL_PATTERN.test(trimmed)) throw new Error('Enter a valid email address.');
    if (password.length < PASSWORD_MIN_LENGTH) throw new Error(`Use a password of at least ${PASSWORD_MIN_LENGTH} characters.`);
    const { data, error } = await supabase.auth.signUp({
      email: trimmed,
      password,
      options: { data: { name: displayName }, emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) {
      console.warn('Haraya: sign up failed', error.message);
      throw new Error(describeAuthError(error.message, 'Could not create the account. Try again.'));
    }
    // Supabase returns a user with no identities when the email is already registered and confirmation is on
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error('That email already has an account. Sign in instead.');
    }
    if (!data.session) return { needsConfirmation: true };
    await setUser(data.user);
    return { needsConfirmation: false };
  },

  /** Sends a one-time sign-in link. After it is opened, the app returns to `returnTab`. */
  async sendMagicLink(email: string, returnTab: string): Promise<void> {
    if (!supabase) throw new Error('Accounts are not available right now.');
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmed)) throw new Error('Enter a valid email address.');
    rememberReturnTab(returnTab);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: `${window.location.origin}/`, shouldCreateUser: true },
    });
    if (error) {
      console.warn('Haraya: sign-in link failed', error.message);
      throw new Error(describeAuthError(error.message, 'Could not send the sign-in link. Check the email and try again.'));
    }
  },

  /** Emails a password-reset link; opening it returns to the new-password form. */
  async sendPasswordReset(email: string): Promise<void> {
    if (!supabase) throw new Error('Accounts are not available right now.');
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmed)) throw new Error('Enter a valid email address.');
    rememberReturnTab(RESET_RETURN_TAB);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo: `${window.location.origin}/` });
    if (error) {
      console.warn('Haraya: password reset failed', error.message);
      throw new Error(describeAuthError(error.message, 'Could not send the reset email. Try again.'));
    }
  },

  /** Sets the new password after a reset link (or for a signed-in user changing it). */
  async updatePassword(password: string): Promise<void> {
    if (!supabase) throw new Error('Accounts are not available right now.');
    if (!user) throw new Error('Your reset link expired. Request a new one.');
    if (password.length < PASSWORD_MIN_LENGTH) throw new Error(`Use a password of at least ${PASSWORD_MIN_LENGTH} characters.`);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      console.warn('Haraya: password update failed', error.message);
      throw new Error(describeAuthError(error.message, 'Could not save the new password. Try again.'));
    }
    recovering = false;
    notify();
  },

  async updateName(name: string): Promise<void> {
    if (!supabase || !user) throw new Error('Sign in first.');
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Add your name.');
    if (trimmed.length > 80) throw new Error('Keep your name under 80 characters.');
    const { error } = await supabase.from('profiles').update({ name: trimmed, updated_at: new Date().toISOString() }).eq('id', user.id);
    if (error) {
      console.warn('Haraya: name update failed', error.message);
      throw new Error('Could not save your name. Try again.');
    }
    await loadProfile();
    notify();
  },

  /** The tab to open after returning from an email link, read once. */
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
    recovering = false;
    await setUser(null);
  },
};
