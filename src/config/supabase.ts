import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Haraya Supabase Client.
 * Initialized only when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are provided.
 * When unconfigured, the application falls back safely to the local reactive store.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      // PKCE returns the sign-in code as ?code=, which does not collide with Haraya's #/ hash routes
      auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
    })
  : null;
