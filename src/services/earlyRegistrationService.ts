import { supabase } from '../config/supabase';

/**
 * The soft-launch promo count (20261001000000_early_registration_promo.sql): how many of the early slots are
 * taken and the caller's own place in the order. The database decides the order; this only reads it. Returns null
 * when the function is missing or unreachable, and the page then shows the offer without a count.
 */

export interface EarlyRegistrationStatus {
  slots: number;
  claimed: number;
  /** The caller's position among confirmed accounts, or null when signed out (or an admin). */
  position: number | null;
}

const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0;

/** Validates the RPC reply, so a changed or broken function never puts a wrong number on the page. */
export function parseEarlyRegistrationStatus(raw: unknown): EarlyRegistrationStatus | null {
  if (!raw || typeof raw !== 'object') return null;
  const { slots, claimed, position } = raw as Record<string, unknown>;
  if (!isCount(slots) || slots === 0 || !isCount(claimed) || claimed > slots) return null;
  if (position !== null && position !== undefined && (!isCount(position) || position === 0)) return null;
  return { slots, claimed, position: typeof position === 'number' ? position : null };
}

export async function fetchEarlyRegistrationStatus(): Promise<EarlyRegistrationStatus | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('early_registration_status');
  if (error) {
    console.warn('Haraya: could not read the early registration count', error.message);
    return null;
  }
  return parseEarlyRegistrationStatus(data);
}
