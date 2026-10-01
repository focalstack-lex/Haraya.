import { supabase } from '../config/supabase';
import { EARLY_COFFEE_SLOTS } from '../config/launch';

/**
 * The soft-launch promo count (20261001020000_early_registration_30_slots.sql): how many of the early slots are
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

/**
 * Validates the RPC reply, so a changed or broken function never puts a wrong number on the page. With
 * expectedSlots, a reply for a different slot count (a database still on an older promo) is refused too.
 */
export function parseEarlyRegistrationStatus(raw: unknown, expectedSlots?: number): EarlyRegistrationStatus | null {
  if (!raw || typeof raw !== 'object') return null;
  const { slots, claimed, position } = raw as Record<string, unknown>;
  if (!isCount(slots) || slots === 0 || !isCount(claimed) || claimed > slots) return null;
  if (expectedSlots !== undefined && slots !== expectedSlots) return null;
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
  return parseEarlyRegistrationStatus(data, EARLY_COFFEE_SLOTS);
}

/** One account in the Control Room's Promo tab (20261001030000_admin_early_registrations.sql). */
export interface EarlyRegistrationRow {
  /** Place among confirmed accounts (1 to the slot count), or null for a sign-up that has not confirmed yet. */
  place: number | null;
  name: string;
  email: string;
  confirmedAt: string | null;
  signedUpAt: string;
}

const isTime = (value: unknown): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value));

/** Validates the admin RPC rows; a malformed row is dropped rather than shown with a wrong place. */
export function parseEarlyRegistrationRows(raw: unknown): EarlyRegistrationRow[] {
  if (!Array.isArray(raw)) return [];
  const rows: EarlyRegistrationRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const { place, name, email, confirmed_at, signed_up_at } = item as Record<string, unknown>;
    // bigint can arrive as a number or a numeric string
    const placeNumber = place === null || place === undefined ? null : Number(place);
    if (placeNumber !== null && (!Number.isInteger(placeNumber) || placeNumber < 1)) continue;
    if (typeof email !== 'string' || !email || !isTime(signed_up_at)) continue;
    if (placeNumber !== null && !isTime(confirmed_at)) continue;
    rows.push({
      place: placeNumber,
      name: typeof name === 'string' ? name : '',
      email,
      confirmedAt: placeNumber === null ? null : (confirmed_at as string),
      signedUpAt: signed_up_at,
    });
  }
  return rows;
}

/** Admins only: the first confirmed accounts in order, then the sign-ups still waiting to confirm. */
export async function fetchEarlyRegistrationList(): Promise<EarlyRegistrationRow[]> {
  if (!supabase) throw new Error('The Control Room is not available right now.');
  const { data, error } = await supabase.rpc('admin_early_registrations');
  if (error) {
    console.warn('Haraya: could not read the early registrations', error.message);
    if (/admin_early_registrations|schema cache|does not exist/i.test(error.message)) {
      throw new Error('This list needs the database update in migration 20261001030000, which is not applied yet. Apply it, then reload.');
    }
    throw new Error(/only admins/i.test(error.message) ? 'Only admins can see this list.' : 'Could not load the list. Try again.');
  }
  return parseEarlyRegistrationRows(data);
}
