import React from 'react';
import { Bookmark, BookmarkCheck, Coffee, Navigation } from 'lucide-react';
import { formatKm } from '../../utils/geo';
import type { Match } from './scoreCafes';

interface MoodResultCardProps {
  label: string;
  match: Match;
  saved: boolean;
  onRoute: () => void;
  onOpen: () => void;
  onToggleSave: () => void;
}

/** One suggestion: why it fits (real catalog facts), how far, how long it stays open, what to order. */
export const MoodResultCard: React.FC<MoodResultCardProps> = ({ label, match, saved, onRoute, onOpen, onToggleSave }) => {
  const { cafe } = match;
  return (
    <article className="bg-[#FFFDF9] rounded-[20px] ios-card-shadow overflow-hidden">
      <div className="flex gap-3 p-3">
        <button onClick={onOpen} className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-[14px] overflow-hidden bg-[#13191F] ios-press" aria-label={`Open ${cafe.name}`}>
          <img src={cafe.images[0]} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
          <span className="absolute left-1.5 bottom-1.5 h-5.5 px-2 rounded-full ios-material-dark text-[#FFFDF9] text-[11px] font-semibold flex items-center whitespace-nowrap">
            {label}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1">
            <button onClick={onOpen} className="min-w-0 flex-1 text-left">
              <h3 className="ios-headline text-[#13191F] truncate">{cafe.name}</h3>
            </button>
            <button
              onClick={onToggleSave}
              aria-pressed={saved}
              aria-label={saved ? `Remove ${cafe.name} from saved` : `Save ${cafe.name}`}
              className="h-11 w-11 -mt-2.5 -mr-2 shrink-0 flex items-center justify-center text-[#7D5C3D] ios-press"
            >
              {saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
          </div>
          <p className="ios-footnote text-[#594C3D] -mt-1.5">
            <span className="font-mono">{formatKm(match.km)}</span>, about <span className="font-mono">{match.walkMin}</span> min walk
            {match.closesAt ? (
              <>
                , open until <span className="font-mono">{match.closesAt}</span>
              </>
            ) : (
              <span className="text-[#8C3A2E]">, closed now</span>
            )}
          </p>
          <ul className="flex flex-wrap gap-1 mt-2" aria-label="Why it fits">
            {match.reasons.map((reason) => (
              <li key={reason} className="h-6 px-2 rounded-full ios-fill text-[12px] font-medium text-[#13191F] flex items-center">
                {reason}
              </li>
            ))}
          </ul>
          <p className="mt-2 ios-footnote text-[#594C3D] flex items-center gap-1 min-w-0">
            <Coffee className="w-3.5 h-3.5 shrink-0 text-[#906D4B]" />
            <span className="truncate">
              Try: <span className="text-[#13191F] font-medium">{match.drink}</span>
            </span>
          </p>
        </div>
      </div>

      <div className="flex gap-2 px-3 pb-3">
        <button
          onClick={onRoute}
          className="flex-1 h-10 rounded-full bg-[#906D4B] text-[#FFFDF9] text-[14px] font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#7D5C3D] ios-press"
        >
          <Navigation className="w-4 h-4" />
          Take me there
        </button>
        <button onClick={onOpen} className="h-10 px-4 rounded-full ios-fill text-[14px] font-semibold text-[#7D5C3D] hover:bg-[#766046]/20 ios-press">
          Details
        </button>
      </div>
    </article>
  );
};
