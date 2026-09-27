import React from 'react';
import { MapPin, Bookmark, BookmarkCheck } from 'lucide-react';
import { Flame } from 'lucide-react';
import type { Cafe } from '../../types/coffee';
import { isOpenNow } from '../../utils/calendar';

interface CafeGridProps {
  cafes: Cafe[];
  savedCafeIds: string[];
  onToggleSave: (cafe: Cafe) => void;
  onSelectCafe: (cafeId: string) => void;
  onSelectRoastery: (cafeId: string) => void;
  emptyTitle?: string;
  emptyBody?: string;
  emptyAction?: { label: string; onClick: () => void };
}

const CafeCard: React.FC<{
  cafe: Cafe;
  saved: boolean;
  onToggleSave: (cafe: Cafe) => void;
  onSelectCafe: (cafeId: string) => void;
  onSelectRoastery: (cafeId: string) => void;
}> = ({ cafe, saved, onToggleSave, onSelectCafe, onSelectRoastery }) => {
  const openNow = isOpenNow(cafe.hours);

  return (
    <article className="group bg-[#FFF9E9] border border-[#E6DCC0] rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#1A2225]/30 transition-all">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#1A2225]">
        <img
          src={cafe.images[0]}
          alt={`${cafe.name} interior and coffee`}
          loading="lazy"
          onClick={() => onSelectCafe(cafe.id)}
          className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-500"
        />
        <button
          onClick={() => onToggleSave(cafe)}
          aria-label={saved ? `Remove ${cafe.name} from saved` : `Save ${cafe.name}`}
          className={`absolute top-2.5 right-2.5 h-9 w-9 rounded-full backdrop-blur-md flex items-center justify-center border transition-colors ${
            saved ? 'bg-[#C86428] border-[#C86428] text-[#FFF9E9]' : 'bg-[#1A2225]/60 border-[#FFF9E9]/25 text-[#FFF9E9]'
          }`}
        >
          {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>
        <span
          className={`absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#1A2225]/75 backdrop-blur-md border border-[#FFF9E9]/20 px-2.5 py-1 text-[10px] font-bold font-sans text-[#FFF9E9]`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${openNow ? 'bg-[#7FB77E]' : 'bg-[#C86428]'}`} />
          {openNow ? 'Open Now' : 'Closed'}
        </span>
        {cafe.isRoastery && (
          <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-[#C86428]/90 px-2 py-1 text-[9px] font-bold tracking-widest text-[#FFF9E9]">
            <Flame className="w-3 h-3" />
            ROASTERY
          </span>
        )}
      </div>

      <div className="p-3 sm:p-4 space-y-2">
        <button onClick={() => onSelectCafe(cafe.id)} className="block text-left w-full">
          <h3 className="font-cooper text-base sm:text-lg font-bold text-[#1A2225] leading-snug truncate group-hover:underline underline-offset-2">
            {cafe.name}
          </h3>
        </button>
        <div className="flex items-center gap-1.5 text-[11px] font-sans text-[#55615D]">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {cafe.district}, {cafe.city}
          </span>
        </div>
        <p className="text-[11px] sm:text-xs font-sans text-[#1A2225]/80 line-clamp-1">
          {cafe.signature} <span className="text-[#55615D]">: {'P'.repeat(cafe.priceLevel)}</span>
        </p>
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {cafe.vibeTags.slice(0, 3).map((tag) => (
            <span key={tag} className="h-6 px-2 rounded-full bg-[#F3ECD8] border border-[#E6DCC0] text-[9px] font-bold font-sans text-[#55615D] flex items-center tracking-wide">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-[#E6DCC0] text-[11px] font-sans text-[#55615D]">
          <span>{cafe.saveCount.toLocaleString()} saves</span>
          {cafe.isRoastery ? (
            <button
              onClick={() => onSelectRoastery(cafe.id)}
              className="font-bold text-[#C86428] hover:underline"
            >
              Visit Roastery
            </button>
          ) : (
            <button onClick={() => onSelectCafe(cafe.id)} className="font-bold text-[#1A2225] hover:underline">
              Inspect
            </button>
          )}
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
  onSelectRoastery,
  emptyTitle = 'No cafes match this pour',
  emptyBody = 'Try clearing a vibe filter or widening the city to find your next cup.',
  emptyAction,
}) => {
  if (cafes.length === 0) {
    return (
      <div className="py-16 text-center space-y-3">
        <h3 className="font-cooper text-xl font-bold text-[#1A2225]">{emptyTitle}</h3>
        <p className="text-sm font-sans text-[#55615D] max-w-sm mx-auto">{emptyBody}</p>
        {emptyAction && (
          <button
            onClick={emptyAction.onClick}
            className="h-10 px-5 rounded-full bg-[#1A2225] text-[#FFF9E9] text-xs font-bold font-sans"
          >
            {emptyAction.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
      {cafes.map((cafe) => (
        <CafeCard
          key={cafe.id}
          cafe={cafe}
          saved={savedCafeIds.includes(cafe.id)}
          onToggleSave={onToggleSave}
          onSelectCafe={onSelectCafe}
          onSelectRoastery={onSelectRoastery}
        />
      ))}
    </div>
  );
};
