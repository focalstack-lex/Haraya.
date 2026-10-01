/**
 * Launch phase. During the soft launch the app is closed: visitors see the pre-registration page and can create an
 * account, but no tab opens until launch. Admins still get the whole app, to prepare listings before opening.
 * Open it by building with VITE_LAUNCH_MODE=open; anything else (or unset) keeps pre-registration on.
 */
export const PRE_REGISTRATION = import.meta.env.VITE_LAUNCH_MODE !== 'open';

/** How many of the first registered accounts are in the coffee offer. Must match the slots in 20261001020000_early_registration_30_slots.sql. */
export const EARLY_COFFEE_SLOTS = 30;

/** How many of those accounts will have the opportunity of a coffee at the selected coffee shop. */
export const EARLY_COFFEE_WINNERS = 3;
