import React, { useState } from 'react';
import { Check, Clock, X } from 'lucide-react';
import { ErrorNote } from '../common/FormControls';
import { spotService } from '../../services/spotService';
import type { SpotRow } from '../../services/spotMapping';

const CARD = 'rounded-[20px] bg-surface ios-card-shadow p-4 sm:p-5';

/** Admin review of community spot submissions: approve to publish, reject with a note to the contributor. */
export const SpotReviewQueue: React.FC<{ rows: SpotRow[]; onViewSpot: (cafeId: string) => void }> = ({ rows, onViewSpot }) => {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const review = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    setError('');
    try {
      await spotService.review(id, status, notes[id] ?? '');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the review.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-2" aria-labelledby="spot-review-title">
      <h2 id="spot-review-title" className="ios-title px-1">
        Spots to review <span className="font-mono text-ink-2">({rows.length})</span>
      </h2>
      {error && <ErrorNote message={error} />}
      {rows.length === 0 ? (
        <p className="px-1 text-[14px] text-ink-2">Nothing waiting for review.</p>
      ) : (
        rows.map((row) => (
          <article key={row.id} className={`${CARD} space-y-2.5`}>
            <div>
              <h3 className="ios-headline text-ink">{row.name}</h3>
              <p className="ios-footnote text-ink-2">
                {row.address}, {row.district}, {row.city}
              </p>
              {row.tip && <p className="text-[14px] text-ink/85 mt-1">"{row.tip}"</p>}
              <p className="ios-footnote text-ink-2 mt-1">
                <span className="font-mono">{row.lat.toFixed(5)}, {row.lng.toFixed(5)}</span>
                {row.opens_at && row.closes_at && (
                  <span className="inline-flex items-center gap-1 ml-2">
                    <Clock className="w-3.5 h-3.5" /> {row.opens_at.slice(0, 5)} to {row.closes_at.slice(0, 5)}
                  </span>
                )}
              </p>
            </div>
            <button onClick={() => onViewSpot(`spot-${row.id}`)} className="ios-footnote font-semibold text-tint-ink ios-press min-h-9">
              See it on the map
            </button>
            <input
              value={notes[row.id] ?? ''}
              onChange={(event) => setNotes((current) => ({ ...current, [row.id]: event.target.value }))}
              maxLength={280}
              placeholder="Note to the contributor (shown if rejected)"
              aria-label={`Review note for ${row.name}`}
              className="w-full h-11 ios-fill rounded-[12px] px-3.5 text-[14px] text-ink placeholder:text-ink-3 focus:outline-none focus:shadow-[0_0_0_2px_#906D4B]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => void review(row.id, 'approved')}
                disabled={busyId === row.id}
                className="h-11 flex-1 rounded-full bg-ok text-surface text-[15px] font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 ios-press"
              >
                <Check className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => void review(row.id, 'rejected')}
                disabled={busyId === row.id}
                className="h-11 flex-1 rounded-full ios-fill text-danger text-[15px] font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 ios-press"
              >
                <X className="w-4 h-4" /> Reject
              </button>
            </div>
          </article>
        ))
      )}
    </section>
  );
};
