import React from 'react';
import { Bookmark, BookmarkCheck, Flame, Star } from 'lucide-react';
import type { Cafe } from '../../types/coffee';
import { AyaMascot } from '../common/AyaMascot';
import { isOpenNow, hasListedHours } from '../../utils/calendar';
import { userPrefsService } from '../../services/userPrefsService';

interface CafeGridProps {
  cafes: Cafe[];
  savedCafeIds: string[];
  onToggleSave: (cafe: Cafe) => void;
  onSelectCafe: (cafeId: string) => void;
  /** Unused: directions moved to the spot sheet. Kept optional for older callers. */
  onDirections?: (cafe: Cafe) => void;
  emptyTitle?: string;
  emptyBody?: string;
  emptyAction?: { label: string; onClick: () => void };
}

const CafeCard: React.FC<{
  cafe: Cafe;
  saved: boolean;
  onToggleSave: (cafe: Cafe) => void;
  onSelectCafe: (cafeId: string) => void;
  /** Marks this card's bookmark as the guided tour's save step. */
  isTourTarget?: boolean;
}> = ({ cafe, saved, onToggleSave, onSelectCafe, isTourTarget }) => {
  const openNow = isOpenNow(cafe.hours);
  const hoursKnown = hasListedHours(cafe.hours);
  const rating = userPrefsService.getRating(cafe.id);

  return (
    <article className="group card-lift card-ambient bg-surface rounded-[20px] overflow-hidden flex flex-col">
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-ink">
        <img
          src={cafe.images[0]}
          alt={`${cafe.name} interior and coffee`}
          loading="lazy"
          onClick={() => onSelectCafe(cafe.id)}
          className="w-full h-full object-cover cursor-pointer"
        />
        <button
          onClick={() => onToggleSave(cafe)}
          data-tour={isTourTarget ? 'save' : undefined}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${cafe.name} from saved` : `Save ${cafe.name}`}
          className={`absolute top-1 right-1 h-11 w-11 flex items-center justify-center ios-press active:scale-90 before:absolute before:inset-[5px] before:rounded-full before:transition-colors ${
            saved
              ? 'text-surface before:bg-tint'
              : 'text-surface before:bg-ink/45 before:backdrop-blur-md hover:before:bg-ink/65'
          }`}
        >
          {saved ? <BookmarkCheck className="relative w-4 h-4" /> : <Bookmark className="relative w-4 h-4" />}
        </button>
      </div>

      {/* Details */}
      <div className="p-3 sm:p-3.5 flex-1">
        <div className="space-y-1">
          <button onClick={() => onSelectCafe(cafe.id)} className="block text-left w-full">
            <h3 className="ios-headline text-ink truncate">{cafe.name}</h3>
          </button>

          <div className="flex items-center gap-1 ios-footnote text-ink-2 min-w-0">
            {cafe.isRoastery && <Flame className="w-3 h-3 shrink-0 text-tint" aria-label="Brews in-house" />}
            <span className="truncate">{cafe.district}, {cafe.city}</span>
          </div>

          <p className="ios-footnote text-ink/85 truncate">
            {cafe.community ? (
              <span className={cafe.community.status === 'pending' ? 'text-tint-ink font-medium' : 'text-ok font-medium'}>
                {cafe.community.status === 'pending' ? 'Pending review' : 'Community gem'}
              </span>
            ) : (
              cafe.signature
            )}{' '}
            <span className="font-mono text-ink-2">{'₱'.repeat(cafe.priceLevel)}</span>
          </p>

          <div className="flex items-center justify-between gap-2 ios-footnote font-medium">
            <p className={!hoursKnown ? 'text-ink-2' : openNow ? 'text-ok' : 'text-danger'}>
              {!hoursKnown ? 'Hours not listed' : openNow ? 'Open now' : 'Closed'}
            </p>
            {rating && (
              <span className="shrink-0 text-tint-ink inline-flex items-center gap-1" aria-label={`Your rating: ${rating.rating} of 5`}>
                <Star className="w-3.5 h-3.5 fill-star text-star" aria-hidden="true" />
                <span className="font-mono">{rating.rating}</span>
              </span>
            )}
          </div>

          <div className="hidden sm:flex flex-wrap gap-1 pt-1">
            {cafe.vibeTags.slice(0, 2).map((tag) => (
              <span key={tag} className="h-5.5 px-2 rounded-full ios-fill text-[11px] font-medium font-sans text-ink-2 flex items-center">
                {tag}
              </span>
            ))}
          </div>
        </div>

      </div>
    </article>
  );
};

export const CafeGrid: React.FC<CafeGridProps> = ({
  cafes,
  savedCafeIds,
  onToggleSave,
  onSelectCafe,
  emptyTitle = 'No cafes match this pour',
  emptyBody = 'Try clearing a vibe filter or widening the city to find your next cup.',
  emptyAction,
}) => {
  if (cafes.length === 0) {
    return (
      <div className="py-12 text-center space-y-2">
        <AyaMascot pose="empty" size={112} alt="" className="mb-1" />
        <h3 className="ios-title text-[19px]">{emptyTitle}</h3>
        <p className="text-[14px] font-sans text-ink-2 max-w-xs mx-auto">{emptyBody}</p>
        {emptyAction && (
          <button
            onClick={emptyAction.onClick}
            className="mt-2 h-11 px-5 rounded-full bg-tint text-surface text-[15px] font-semibold font-sans ios-press"
          >
            {emptyAction.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {cafes.map((cafe, index) => (
        <CafeCard
          key={cafe.id}
          isTourTarget={index === 0}
          cafe={cafe}
          saved={savedCafeIds.includes(cafe.id)}
          onToggleSave={onToggleSave}
          onSelectCafe={onSelectCafe}
        />
      ))}
    </div>
  );
};
