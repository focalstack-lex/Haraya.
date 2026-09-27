/**
 * Sister ecosystem bridge between Haraya (coffee) and Habi (fashion).
 * HABI_URL is the single integration point: update it once Habi's production
 * URL is final. Until then it points at the sibling project's local dev port.
 */
export const HABI_URL = 'http://127.0.0.1:5173';

export const SISTER_PLATFORM = {
  id: 'habi',
  name: 'Habi',
  tagline: 'Davao Local Fashion',
  url: HABI_URL,
} as const;
