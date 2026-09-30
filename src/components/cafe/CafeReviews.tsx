import React, { useEffect } from 'react';
import { Flag, Star } from 'lucide-react';
import type { Cafe } from '../../types/coffee';
import { reviewService } from '../../services/reviewService';
import { sessionService } from '../../services/sessionService';
import { timeAgo } from '../../services/visitMapping';
import { useReviewVersion, useSessionVersion } from '../../hooks/useServiceVersions';
import { GROUP, SECTION_LABEL } from '../common/sheetStyles';
import type { ReportSubject } from './ReportSheet';

/**
 * Public reviews on a spot page: the average, then the newest few with their words. Shows nothing until
 * the spot has at least one review, so an unreviewed spot is not padded with an empty box.
 */
export const CafeReviews: React.FC<{ cafe: Cafe; onReport: (subject: ReportSubject) => void }> = ({ cafe, onReport }) => {
  useReviewVersion();
  useSessionVersion();

  useEffect(() => {
    void reviewService.load(cafe.id);
  }, [cafe.id]);

  const reviews = reviewService.getReviews(cafe.id);
  const summary = reviewService.getAverage(cafe.id);
  if (!summary) return null;

  const me = sessionService.getUser()?.id ?? null;
  const now = new Date();

  return (
    <section className="space-y-1.5" aria-labelledby={`reviews-${cafe.id}`}>
      <h3 id={`reviews-${cafe.id}`} className={SECTION_LABEL}>
        Reviews
      </h3>
      <div className={GROUP}>
        <div className="ios-group-row">
          <Star className="w-4.5 h-4.5 shrink-0 text-star fill-star" />
          <span className="text-[15px] text-ink">
            <span className="font-mono font-semibold">{summary.average.toFixed(1)}</span> of 5 from{' '}
            <span className="font-mono">{summary.count}</span> {summary.count === 1 ? 'review' : 'reviews'}
          </span>
        </div>
        {reviews.slice(0, 5).map((review) => {
          const own = me !== null && review.user_id === me;
          return (
            <div key={review.id} className="ios-group-row items-start">
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[15px] text-ink">
                  <span className="truncate">{own ? 'You' : review.author_name}</span>
                  <span className="inline-flex items-center gap-0.5 shrink-0 font-mono text-[13px] text-ink-2" aria-label={`${review.rating} of 5`}>
                    <Star className="w-3.5 h-3.5 text-star fill-star" />
                    {review.rating}
                  </span>
                  <span className="shrink-0 ios-footnote text-ink-2">{timeAgo(review.created_at, now)}</span>
                </span>
                {review.body && <span className="block text-[14px] text-ink/85 leading-snug break-words">{review.body}</span>}
              </span>
              {!own && (
                <button
                  onClick={() => onReport({ type: 'review', id: review.id, label: `Review of ${cafe.name} by ${review.author_name}` })}
                  aria-label={`Report the review by ${review.author_name}`}
                  className="h-11 w-11 -mr-2 -mt-1.5 shrink-0 flex items-center justify-center text-ink-3 ios-press"
                >
                  <Flag className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
