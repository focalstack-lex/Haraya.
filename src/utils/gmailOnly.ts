/**
 * New accounts are Gmail only. The form checks it so the visitor hears it before anything is sent, and the database
 * refuses any other address on its own (20261001010000_gmail_only_signups.sql), because the sign-up API can be called
 * without this app. Existing accounts on other addresses can still sign in. Keep the domain in step with that file.
 */
export const GMAIL_DOMAIN = 'gmail.com';

export const GMAIL_ONLY_MESSAGE = 'Use a Gmail address (ending in @gmail.com) to create an account.';

export function isGmailAddress(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  return at > 0 && trimmed.slice(at + 1) === GMAIL_DOMAIN;
}
