import React from 'react';
import { Bookmark, ChevronRight } from 'lucide-react';
import type { Cafe } from '../../types/coffee';
import { isOpenNow, hasListedHours } from '../../utils/calendar';

interface PopularPicksSectionProps {
  /** Cafes already ranked by save count. */
  cafes: Cafe[];
  onSelectCafe: (cafeId: string) => void;
  onViewAll: () => void;
}

const saves = new Intl.NumberFormat();

/** "Most saved" shelf: the venues Haraya users bookmark most, from real save counts. */
export const PopularPicksSection: React.FC<PopularPicksSectionProps> = ({ cafes, onSelectCafe, onViewAll }) => {
  if (cafes.length === 0) return null;

  return (
    <section aria-labelledby="most-saved-title" className="space-y-3">
      <div className="flex items-end justify-between">
        <h2 id="most-saved-title" className="ios-title">
          Most saved
        </h2>
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-0.5 min-h-11 -my-2 text-[15px] font-medium text-tint-ink ios-press"
        >
          See all
          <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>

      <div className="-mx-4 sm:mx-0">
        <div className="ios-shelf gap-3 px-4 sm:px-0 pb-2 sm:grid sm:grid-cols-3 sm:gap-4">
          {cafes.map((cafe) => {
            const openNow = isOpenNow(cafe.hours);
            const hoursKnown = hasListedHours(cafe.hours);
            return (
              <button
                key={cafe.id}
                type="button"
                onClick={() => onSelectCafe(cafe.id)}
                className="w-[62%] max-w-[260px] sm:w-auto sm:max-w-none shrink-0 text-left bg-surface rounded-[20px] overflow-hidden ios-card-shadow ios-press active:scale-[0.98]"
              >
                <span className="block relative aspect-[4/3] bg-ink">
                  <img src={cafe.images[0]} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                </span>
                <span className="block p-3.5 space-y-0.5">
                  <span className="block ios-headline text-ink truncate">{cafe.name}</span>
                  <span className="block ios-footnote text-ink-2 truncate">
                    {cafe.district}, {cafe.city}
                  </span>
                  <span className="flex items-center gap-2 pt-1.5 ios-footnote">
                    <span className="inline-flex items-center gap-1 text-ink font-medium font-mono">
                      <Bookmark className="w-3.5 h-3.5 text-tint" strokeWidth={2.2} />
                      {saves.format(cafe.saveCount)}
                    </span>
                    <span className="text-ink-2 font-mono">{'₱'.repeat(cafe.priceLevel)}</span>
                    <span className={`ml-auto font-medium ${!hoursKnown ? 'text-ink-2' : openNow ? 'text-ok' : 'text-danger'}`}>
                      {!hoursKnown ? 'Hours not listed' : openNow ? 'Open' : 'Closed'}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
