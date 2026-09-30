import { supabase } from '../config/supabase';

/**
 * Error reports and anonymous usage events, kept in Haraya's own database and read in the Control Room
 * (tables client_errors and app_events, 20260930020000). No third-party tracker is loaded.
 *
 * Events carry a name and one short detail, never an account id or a device id. Error reports carry the
 * message, the stack and the page. Both are throttled here and capped again in the database, and both do
 * nothing on a development server, so local work does not fill the tables.
 */

export type EventName = 'search_no_results' | 'city_empty' | 'tab_view';

const MAX_ERRORS_PER_VISIT = 5;
const sentErrors = new Set<string>();
const sentEvents = new Set<string>();
/** Set when the tables are missing (migration not applied): stop asking for the rest of the visit. */
let unavailable = false;

const enabled = (): boolean => supabase !== null && !unavailable && import.meta.env.PROD;

const isMissingTable = (message: string): boolean => /schema cache|does not exist|Could not find/i.test(message);

/** Sends one error report. Never throws: a failing reporter must not break the page further. */
export function reportError(error: unknown, where: string = ''): void {
  try {
    const message = (error instanceof Error ? error.message : String(error)).slice(0, 500);
    if (!message || !enabled() || !supabase) return;
    if (sentErrors.size >= MAX_ERRORS_PER_VISIT || sentErrors.has(message)) return;
    sentErrors.add(message);
    const stack = error instanceof Error && error.stack ? error.stack.slice(0, 2000) : '';
    void supabase
      .from('client_errors')
      .insert({
        message: where ? `${where}: ${message}`.slice(0, 500) : message,
        stack,
        // The route only, never the query string (sign-in codes arrive there)
        page: `${window.location.pathname}${window.location.hash.split('?')[0]}`.slice(0, 200),
        user_agent: navigator.userAgent.slice(0, 300),
        app_version: import.meta.env.MODE.slice(0, 40),
      })
      .then(({ error: failure }) => {
        if (failure && isMissingTable(failure.message)) unavailable = true;
      });
  } catch {
    // Reporting is best effort
  }
}

/** Records one usage event, once per visit for the same name and detail. */
export function trackEvent(name: EventName, detail: string = ''): void {
  try {
    const clean = detail.trim().toLowerCase().slice(0, 80);
    const key = `${name}|${clean}`;
    if (!enabled() || !supabase || sentEvents.has(key)) return;
    sentEvents.add(key);
    void supabase
      .from('app_events')
      .insert({ name, detail: clean })
      .then(({ error: failure }) => {
        if (failure && isMissingTable(failure.message)) unavailable = true;
      });
  } catch {
    // Usage counts are best effort
  }
}

/** Reports uncaught errors and rejected promises. Called once from main.tsx. */
export function installErrorReporting(): void {
  window.addEventListener('error', (event) => reportError(event.error ?? event.message, 'uncaught'));
  window.addEventListener('unhandledrejection', (event) => reportError(event.reason, 'unhandled promise'));
}
