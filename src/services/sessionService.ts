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

/** A return tab older than this is stale (the link was never opened, or opened days later). */
const RETURN_TAB_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Whether this page load is the landing of an email link or OAuth redirect (?code=, ?token_hash=, #access_token=).
 * Read at import, before start() cleans the URL. Only such a load may act on a stored return tab, so a leftover
 * one never moves a visitor who simply opens the app.
 */
const arrivedFromAuthRedirect = (() => {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.has('code') || params.has('token_hash') || window.location.hash.includes('access_token=');
  } catch {
    return false;
  }
})();

/** Origins a developer runs the app on; their sign-in links must return to the same origin. */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

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

/**
 * Remembers where to land after an email link or OAuth sign-in. localStorage, not sessionStorage: a confirmation
 * link opens in a new tab, and sessionStorage belongs to the tab that sent the email, so it was always empty there.
 */
function rememberReturnTab(tab: string): void {
  try {
    localStorage.setItem(AFTER_SIGN_IN_KEY, JSON.stringify({ tab, at: Date.now() }));
  } catch (error) {
    console.warn('Haraya: could not remember the return tab', error);
  }
}

/** The stored return tab, only on an auth redirect landing and only while fresh. */
function readReturnTab(): string | null {
  if (!arrivedFromAuthRedirect) return null;
  try {
    const raw = localStorage.getItem(AFTER_SIGN_IN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { tab?: unknown; at?: unknown };
    if (typeof parsed.tab !== 'string' || typeof parsed.at !== 'number') return null;
    return Date.now() - parsed.at <= RETURN_TAB_MAX_AGE_MS ? parsed.tab : null;
  } catch {
    return null;
  }
}

/**
 * Redirect target for email confirmations, magic links, Google OAuth, and password resets.
 *
 * The link must come back to the origin that started the flow: with PKCE, supabase-js keeps the code
 * verifier in that origin's storage, and the ?code= exchange fails anywhere else. So localhost stays on
 * localhost and a Vercel preview stays on itself; only the apex domain is folded into www (the apex
 * 308-redirects to www with the query intact, so the app never runs on the apex). Supabase still has to
 * allow-list each origin, or it falls back to the project's Site URL. VITE_SITE_URL covers an unknown origin.
 */
export function getAuthRedirectUrl(originOverride?: string): string {
  let origin = originOverride;
  if (!origin && typeof window !== 'undefined' && window.location) {
    origin = window.location.origin;
  }

  if (origin) {
    try {
      const parsed = new URL(origin);
      // Production domain (apex haraya.space or www.haraya.space)
      if (parsed.hostname === 'haraya.space' || parsed.hostname === 'www.haraya.space') {
        return 'https://www.haraya.space/';
      }
      // Local development and Vercel previews: same origin, because the PKCE verifier lives there
      if (LOCAL_HOSTS.has(parsed.hostname) || parsed.hostname.endsWith('.vercel.app')) {
        return `${parsed.origin}/`;
      }
    } catch {
      // Ignore URL parsing errors and fall back to the configured or canonical production origin
    }
  }

  const envUrl = (import.meta.env.VITE_SITE_URL || import.meta.env.VITE_AUTH_REDIRECT_URL || '') as string;
  if (envUrl.trim()) {
    const trimmed = envUrl.trim();
    return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
  }

  // Canonical production fallback ensures email confirmations and OAuth always land on the live app
  return 'https://www.haraya.space/';
}

/** Sign-in refused because the address was never confirmed; the caller can offer to resend the link. */
export class UnconfirmedEmailError extends Error {
  constructor() {
    super('Confirm your email first: open the link we sent you, then sign in.');
    this.name = 'UnconfirmedEmailError';
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
  if (
    text.includes('signups not allowed') ||
    text.includes('email signups are disabled') ||
    text.includes('email_provider_disabled')
  ) {
    return 'Email sign-up is disabled in your Supabase project. Use Continue with Google above, or enable Email in Supabase Auth Providers.';
  }
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

  // If the profile has no name, hydrate it from OAuth metadata if provided (e.g. Google full_name)
  const metaName = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string);
  if (profile && !profile.name && metaName) {
    const trimmed = metaName.trim().slice(0, 80);
    profile.name = trimmed;
    void supabase.from('profiles').update({ name: trimmed }).eq('id', user.id);
  }
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

  /** Display name: the profile name, OAuth metadata name, or the part of the email before @. */
  getDisplayName(): string {
    if (profile?.name) return profile.name;
    const metaName = (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string);
    if (metaName) return metaName.trim();
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
      if (error.message.toLowerCase().includes('email not confirmed')) throw new UnconfirmedEmailError();
      throw new Error(describeAuthError(error.message, 'Could not sign in. Check the email and password and try again.'));
    }
    await setUser(data.user);
  },

  /**
   * Creates an account. When the project requires email confirmation there is no session yet, and the
   * caller shows a "check your email" note instead.
   */
  async signUpWithPassword(email: string, password: string, name: string, returnTab: string = 'profile'): Promise<{ needsConfirmation: boolean }> {
    if (!supabase) throw new Error('Accounts are not available right now.');
    const trimmed = email.trim().toLowerCase();
    const displayName = name.trim();
    if (!displayName) throw new Error('Add your name.');
    if (displayName.length > 80) throw new Error('Keep your name under 80 characters.');
    if (!EMAIL_PATTERN.test(trimmed)) throw new Error('Enter a valid email address.');
    if (password.length < PASSWORD_MIN_LENGTH) throw new Error(`Use a password of at least ${PASSWORD_MIN_LENGTH} characters.`);
    // Opening the confirmation link signs the visitor in and lands them here, not on Discover
    rememberReturnTab(returnTab);
    const { data, error } = await supabase.auth.signUp({
      email: trimmed,
      password,
      options: { data: { name: displayName }, emailRedirectTo: getAuthRedirectUrl() },
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

  /**
   * Sends the confirmation email again for an account that never opened the first one. Supabase rate-limits
   * this per address, and answers the same way whether or not the address exists.
   */
  async resendConfirmation(email: string, returnTab: string = 'profile'): Promise<void> {
    if (!supabase) throw new Error('Accounts are not available right now.');
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmed)) throw new Error('Enter a valid email address.');
    rememberReturnTab(returnTab);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: trimmed,
      options: { emailRedirectTo: getAuthRedirectUrl() },
    });
    if (error) {
      console.warn('Haraya: resend confirmation failed', error.message);
      throw new Error(describeAuthError(error.message, 'Could not resend the confirmation email. Try again.'));
    }
  },

  /** Signs in or creates an account with Google via Supabase OAuth. */
  async signInWithGoogle(returnTab: string = 'profile'): Promise<void> {
    if (!supabase) throw new Error('Accounts are not available right now.');
    rememberReturnTab(returnTab);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) {
      console.warn('Haraya: Google sign-in failed', error.message);
      throw new Error(describeAuthError(error.message, 'Could not start Google sign in. Try again.'));
    }
    if (data?.url) {
      window.location.href = data.url;
    }
  },

  /** Sends a one-time sign-in link. After it is opened, the app returns to `returnTab`. */
  async sendMagicLink(email: string, returnTab: string): Promise<void> {
    if (!supabase) throw new Error('Accounts are not available right now.');
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmed)) throw new Error('Enter a valid email address.');
    rememberReturnTab(returnTab);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: getAuthRedirectUrl(), shouldCreateUser: true },
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
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo: getAuthRedirectUrl() });
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

  /** Whether the user signed in with Google/OAuth and still needs to complete initial account setup (username + password). */
  needsAccountSetup(): boolean {
    if (!user) return false;
    const isOAuth =
      user.app_metadata?.provider === 'google' ||
      user.app_metadata?.providers?.includes('google') ||
      user.identities?.some((i) => i.provider === 'google');
    if (!isOAuth) return false;
    return !user.user_metadata?.account_setup_done;
  },

  /** Completes initial account setup for Google users: updates username and sets a password. */
  async completeAccountSetup(username: string, password: string): Promise<void> {
    if (!supabase || !user) throw new Error('Sign in first.');
    const trimmed = username.trim();
    if (!trimmed) throw new Error('Enter your name or username.');
    if (trimmed.length > 80) throw new Error('Keep your username under 80 characters.');
    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new Error(`Use a password of at least ${PASSWORD_MIN_LENGTH} characters.`);
    }

    const { data, error } = await supabase.auth.updateUser({
      password,
      data: { name: trimmed, account_setup_done: true },
    });
    if (error) {
      console.warn('Haraya: complete account setup failed', error.message);
      throw new Error(describeAuthError(error.message, 'Could not complete account setup. Try again.'));
    }
    if (data.user) {
      user = data.user;
    }

    // Also update profiles table
    void supabase
      .from('profiles')
      .update({ name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (profile) {
      profile.name = trimmed;
    }
    notify();
  },

  /** The tab to open after returning from an email link or OAuth sign in, read once. */
  takeReturnTab(): string | null {
    const tab = readReturnTab();
    try {
      if (tab) localStorage.removeItem(AFTER_SIGN_IN_KEY);
    } catch (error) {
      console.warn('Haraya: could not clear the return tab', error);
    }
    return tab;
  },

  /** Inspect the pending return tab without clearing it. */
  peekReturnTab(): string | null {
    return readReturnTab();
  },

  async signOut(): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.warn('Haraya: sign out failed', error.message);
    recovering = false;
    await setUser(null);
  },
};
