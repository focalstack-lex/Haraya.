/**
 * Launch phase. During the soft launch the app is closed: visitors see the pre-registration page and can create an
 * account, but no tab opens until launch. Admins still get the whole app, to prepare listings before opening.
 * Open it by building with VITE_LAUNCH_MODE=open; anything else (or unset) keeps pre-registration on.
 */
export const PRE_REGISTRATION = import.meta.env.VITE_LAUNCH_MODE !== 'open';

/** How many of the first registered accounts get the coffee offer. Must match the slots in 20261001000000_early_registration_promo.sql. */
export const EARLY_COFFEE_SLOTS = 20;
