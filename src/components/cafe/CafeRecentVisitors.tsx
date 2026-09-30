import React, { useEffect, useState } from 'react';
import { Flag, Lock, Volume1 } from 'lucide-react';
import type { Cafe } from '../../types/coffee';
import { visitService } from '../../services/visitService';
import { sessionService } from '../../services/sessionService';
import { useVisitVersion, useSessionVersion } from '../../hooks/useServiceVersions';
import { communityPulse, formatDuration, NOISE_LEVELS, timeAgo, type Visit } from '../../services/visitMapping';
import { CupClinkIcon } from '../common/CustomIcons';
import { GROUP, SECTION_LABEL } from '../common/sheetStyles';
import type { ReportSubject } from './ReportSheet';

const NOISE_WORD: Record<string, string> = Object.fromEntries(NOISE_LEVELS.map((level) => [level.id, level.label.toLowerCase()]));

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'H'
  );
}

/** "Focused 2h 15m, Americano, quiet" or "Quick stamp" */
function describe(visit: Visit): string {
  const parts = [visit.sessionType === 'focus' ? `Focused ${formatDuration(visit.durationMinutes)}` : 'Quick stamp'];
  if (visit.drinkOrdered) parts.push(visit.drinkOrdered);
  if (visit.noiseLevel) parts.push(NOISE_WORD[visit.noiseLevel]);
  return parts.join(', ');
}

/**
 * "Recent scouts and students" on a spot page: the latest noise report from the last 24 hours, then the
 * newest public sessions logged there (and the viewer's own), each with a Cup Clink. Loads from Supabase
 * when the sheet opens; with no connection or no sanctuary tables yet it shows only the viewer's visits.
 */
export const CafeRecentVisitors: React.FC<{ cafe: Cafe; onReport?: (subject: ReportSubject) => void }> = ({ cafe, onReport }) => {
  useVisitVersion();
  useSessionVersion();
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void visitService.loadCafeVisits(cafe.id);
  }, [cafe.id]);

  const visits = visitService.getCafeVisits(cafe.id);
  const loading = visitService.isCafeLoading(cafe.id);
  const now = new Date();
  const pulse = communityPulse(visits, now);
  const me = sessionService.getUser()?.id ?? null;

  const clink = async (visit: Visit) => {
    const blocker = visitService.clinkBlocker(visit);
    if (blocker) {
      setNotice(blocker);
      return;
    }
    setNotice(null);
    try {
      await visitService.toggleCupClink(visit);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not send the Cup Clink.');
    }
  };

  return (
    <section className="space-y-1.5" aria-labelledby={`scouts-${cafe.id}`}>
      <h3 id={`scouts-${cafe.id}`} className={SECTION_LABEL}>
        Recent scouts and students
      </h3>
      <div className={GROUP}>
        {pulse && (
          <div className="ios-group-row">
            <Volume1 className="w-4.5 h-4.5 text-tint shrink-0" />
            <span className="text-[15px] text-ink">
              Reported <span className="font-semibold">{NOISE_WORD[pulse.noise]}</span> {timeAgo(pulse.latestAt, now)} by{' '}
              <span className="font-mono">{pulse.reports}</span> {pulse.reports === 1 ? 'scout' : 'scouts'}
            </span>
          </div>
        )}

        {visits.length === 0 ? (
          <div className="ios-group-row">
            <span className="text-[15px] text-ink-2">
              {loading ? 'Loading recent sessions...' : 'No sessions logged here yet. Check in when you visit to start the log.'}
            </span>
          </div>
        ) : (
          visits.slice(0, 5).map((visit) => {
            const own = visit.userId === null || visit.userId === me;
            const clinked = visitService.hasClinked(visit.id);
            return (
              <div key={visit.id} className="ios-group-row">
                <span
                  aria-hidden="true"
                  className="h-9 w-9 shrink-0 rounded-full bg-tint/15 text-tint-ink text-[13px] font-semibold flex items-center justify-center"
                >
                  {own ? 'You' : initials(visit.visitorName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] text-ink truncate">
                    {own ? 'You' : visit.visitorName}
                    <span className="text-ink-2"> · {timeAgo(visit.createdAt, now)}</span>
                  </span>
                  <span className="block ios-footnote text-ink-2 truncate">
                    {!visit.isPublic && <Lock className="inline w-3 h-3 -mt-0.5 mr-1" aria-label="Only you" />}
                    {describe(visit)}
                  </span>
                </span>
                {own ? (
                  <span className="shrink-0 inline-flex items-center gap-1 text-ink-2" aria-label={`${visit.clinksCount} Cup Clinks`}>
                    <CupClinkIcon className="w-4.5 h-4.5" />
                    <span className="font-mono text-[14px]">{visit.clinksCount}</span>
                  </span>
                ) : (
                  <>
                  {onReport && (
                    <button
                      onClick={() => onReport({ type: 'visit', id: visit.id, label: `Check-in at ${cafe.name} by ${visit.visitorName}` })}
                      aria-label={`Report the check-in by ${visit.visitorName}`}
                      className="h-11 w-9 shrink-0 flex items-center justify-center text-ink-3 ios-press"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => clink(visit)}
                    aria-pressed={clinked}
                    aria-label={`${clinked ? 'Remove Cup Clink from' : 'Send a Cup Clink to'} ${visit.visitorName}, ${visit.clinksCount} so far`}
                    className={`h-11 min-w-11 -mr-2 px-2 shrink-0 rounded-full inline-flex items-center justify-center gap-1 ios-press ${
                      clinked ? 'text-tint-ink' : 'text-ink-2'
                    }`}
                  >
                    <span className={`h-8 px-2.5 rounded-full inline-flex items-center gap-1 ${clinked ? 'bg-tint/18' : 'ios-fill'}`}>
                      <CupClinkIcon className="w-4.5 h-4.5" />
                      <span className="font-mono text-[14px] font-semibold">{visit.clinksCount}</span>
                    </span>
                  </button>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
      {notice && (
        <p role="status" className="px-4 ios-footnote text-ink-2">
          {notice}
        </p>
      )}
    </section>
  );
};
