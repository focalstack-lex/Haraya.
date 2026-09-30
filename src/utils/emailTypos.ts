/**
 * Spots an address whose domain is a near miss of a popular mail provider (gmial.com, gmail.con, hotmial.com).
 * A mistyped domain means the confirmation email went nowhere, so the confirm screen offers to change the address
 * only then. Returns the corrected address, or null when the address looks fine: an unusual domain such as a
 * school's is never flagged, and a typo in the part before the @ cannot be detected at all.
 */
const POPULAR_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];

/** Real domains that sit close to a popular one (ymail.com is one letter from gmail.com) and are never flagged. */
const REAL_LOOKALIKES = ['ymail.com', 'rocketmail.com', 'googlemail.com', 'live.com', 'msn.com', 'me.com', 'mac.com', 'proton.me', 'protonmail.com', 'pm.me'];

/** Edit distance where swapping two neighbouring letters counts as one change (gmial to gmail). */
function distance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array.from({ length: b.length }, () => 0)]);
  for (let j = 1; j <= b.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }
  return rows[a.length][b.length];
}

export function suggestEmail(address: string): string | null {
  const trimmed = address.trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at < 1) return null;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (POPULAR_DOMAINS.includes(domain) || REAL_LOOKALIKES.includes(domain)) return null;
  const match = POPULAR_DOMAINS.find((known) => distance(domain, known) <= 2);
  return match ? `${local}@${match}` : null;
}
