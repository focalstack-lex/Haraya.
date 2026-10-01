import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { ErrorNote } from '../common/FormControls';
import { EARLY_COFFEE_SLOTS, EARLY_COFFEE_WINNERS } from '../../config/launch';
import { fetchEarlyRegistrationList, type EarlyRegistrationRow } from '../../services/earlyRegistrationService';

/**
 * The early coffee offer, from the admin side: the first confirmed accounts in the order the pre-registration page
 * counts them, then the sign-ups that have not confirmed yet and so hold no place. Read from the database on open
 * and on Refresh (20261001030000_admin_early_registrations.sql); nothing here changes an account.
 */

const SMALL_BUTTON = 'h-9 px-3 rounded-full ios-fill text-[13px] font-semibold text-tint-ink inline-flex items-center gap-1 disabled:opacity-50 ios-press';

const when = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const Row: React.FC<{ row: EarlyRegistrationRow }> = ({ row }) => (
  <li className="ios-group-row">
    <span className="h-9 w-9 shrink-0 rounded-full bg-tint/15 text-tint-ink flex items-center justify-center font-mono text-[14px] font-semibold" aria-hidden="true">
      {row.place ?? '-'}
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[15px] text-ink truncate">{row.name || row.email}</span>
      <span className="block ios-footnote text-ink-2 truncate">
        {row.email}
        {' · '}
        {row.confirmedAt ? `confirmed ${when(row.confirmedAt)}` : `signed up ${when(row.signedUpAt)}`}
      </span>
    </span>
  </li>
);

export const PromoPanel: React.FC = () => {
  const [rows, setRows] = useState<EarlyRegistrationRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      setRows(await fetchEarlyRegistrationList());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load the list. Try again.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const ranked = (rows ?? []).filter((row) => row.place !== null);
  const waiting = (rows ?? []).filter((row) => row.place === null);

  return (
    <div className="space-y-6">
      <section className="space-y-2" aria-labelledby="promo-ranked-title">
        <div className="flex items-center justify-between gap-3 px-1">
          <h2 id="promo-ranked-title" className="ios-title">
            First {EARLY_COFFEE_SLOTS} accounts{' '}
            <span className="font-mono text-ink-2">
              ({ranked.length} of {EARLY_COFFEE_SLOTS})
            </span>
          </h2>
          <button onClick={() => void load()} disabled={busy} className={SMALL_BUTTON}>
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        {error && <ErrorNote message={error} />}
        {rows === null ? (
          !error && <p className="px-1 text-[14px] text-ink-2">Loading...</p>
        ) : ranked.length === 0 ? (
          <p className="px-1 text-[14px] text-ink-2">No confirmed accounts yet.</p>
        ) : (
          <ol className="ios-group ios-card-shadow">
            {ranked.map((row) => (
              <Row key={`${row.place}-${row.email}`} row={row} />
            ))}
          </ol>
        )}
        <p className="px-1 ios-footnote text-ink-2">
          {EARLY_COFFEE_WINNERS} of these {EARLY_COFFEE_SLOTS} will have the opportunity of a coffee. Ranked by when the email was
          confirmed, the same order the pre-registration page counts; admins are not counted, and a deleted account moves
          everyone after it up one place. Refresh right before choosing.
        </p>
      </section>

      {waiting.length > 0 && (
        <section className="space-y-2" aria-labelledby="promo-waiting-title">
          <h2 id="promo-waiting-title" className="ios-title px-1">
            Not confirmed yet <span className="font-mono text-ink-2">({waiting.length})</span>
          </h2>
          <ul className="ios-group ios-card-shadow">
            {waiting.map((row) => (
              <Row key={row.email} row={row} />
            ))}
          </ul>
          <p className="px-1 ios-footnote text-ink-2">These sign-ups hold no place until they confirm their email. Newest first.</p>
        </section>
      )}
    </div>
  );
};
