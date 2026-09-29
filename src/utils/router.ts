/**
 * Hash routes so cafes, beans, roasteries, drops, and shared lists have shareable
 * URLs without server configuration:
 *
 *   #/tab/feed           a top-level tab
 *   #/cafe/<cafe-id>    opens the cafe detail modal over the current tab
 *   #/bean/<bean-id>   opens the bean detail modal
 *   #/roastery/<handle>      a roastery storefront
 *   #/drop/<drop-id>        the drops tab scrolled to one drop
 *   #/list/<slug>?name=Weekend&items=<cafe-id>,<cafe-id>   a shared custom list
 */

export interface Route {
  kind: 'tab' | 'cafe' | 'bean' | 'roastery' | 'drop' | 'list' | 'none';
  id: string;
  query: URLSearchParams;
}

export function parseHash(hash: string = window.location.hash): Route {
  const raw = hash.replace(/^#/, '');
  if (!raw || raw === '/') return { kind: 'none', id: '', query: new URLSearchParams() };
  const [path, queryString = ''] = raw.split('?');
  const query = new URLSearchParams(queryString);
  const parts = path.split('/').filter(Boolean);
  const [head, ...rest] = parts;
  const id = decodeURIComponent(rest.join('/'));

  switch (head) {
    case 'tab':
      return { kind: 'tab', id, query };
    case 'cafe':
      return { kind: 'cafe', id, query };
    case 'bean':
      return { kind: 'bean', id, query };
    case 'roastery':
      return { kind: 'roastery', id, query };
    case 'drop':
      return { kind: 'drop', id, query };
    case 'list':
      return { kind: 'list', id, query };
    default:
      return { kind: 'none', id: '', query };
  }
}

export function buildHash(path: string, query?: Record<string, string>): string {
  const params = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
  }
  const queryString = params.toString();
  return `#${path}${queryString ? `?${queryString}` : ''}`;
}

/** Updates the address bar without firing hashchange (replace) or with history (push). */
export function setHash(hash: string, mode: 'replace' | 'push' = 'replace'): void {
  if (window.location.hash === hash) return;
  const url = `${window.location.pathname}${window.location.search}${hash}`;
  if (mode === 'push') window.history.pushState(null, '', url);
  else window.history.replaceState(null, '', url);
}

export function absoluteUrl(hash: string): string {
  return `${window.location.origin}${window.location.pathname}${hash}`;
}

/** Running as the home-screen app (Android/desktop display-mode, or iOS's navigator.standalone). */
export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Whether this load should open on the landing page: only a bare URL. Deep links (#/tab/..., #/cafe/...), a
 * sign-in or reset return from Supabase (?code=, #access_token=), the home-screen app, and an offline visit
 * (OfflineNotice explains that state) all go straight in.
 */
export function isLandingEntry(): boolean {
  const hash = window.location.hash;
  if (hash && hash !== '#' && hash !== '#/') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has('code') || params.has('error') || params.has('token_hash')) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  return !isStandaloneDisplay();
}
