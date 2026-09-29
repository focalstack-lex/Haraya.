import React from 'react';
import { Navigation, X } from 'lucide-react';
import type { Cafe, Weekday } from '../../types/coffee';
import { formatKm, walkMinutes } from '../../utils/geo';
import { minutesUntilClose } from '../../utils/calendar';
import { pinStatus } from './mapPins';
import { NEARBY_RADIUS_KM } from './nearby';

/** Inside the last hour the card counts down, so a visitor does not walk to a door that is about to shut. */
const CLOSING_SOON_MIN = 60;

const WEEKDAYS: Weekday[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** `HH:MM` on the 24-hour clock, the format the rest of Haraya shows hours in. */
const clockAfter = (now: Date, minutes: number): string => {
  const at = new Date(now.getTime() + minutes * 60_000);
  return `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
};

interface MapPreviewCardProps {
  cafe: Cafe;
  /** Distance from the visitor, or null before they are located. */
  km: number | null;
  onView: (cafeId: string) => void;
  /** Opens the directions picker: walk there on Haraya's map, or open the spot in a maps app. */
  onDirections?: (cafe: Cafe) => void;
  onClose: () => void;
}

/** The spot behind a tapped pin: where it is, whether it is open and until when, and directions one tap away. */
export const MapPreviewCard: React.FC<MapPreviewCardProps> = ({ cafe, km, onView, onDirections, onClose }) => {
  const now = new Date();
  const status = pinStatus(cafe.hours, now);
  const minutesLeft = status === 'open' ? minutesUntilClose(cafe.hours, now) : 0;
  const today = cafe.hours[WEEKDAYS[now.getDay()]];

  return (
    // Sits above the map credits so the OpenStreetMap attribution stays readable
    <div
      role="dialog"
      aria-label={cafe.name}
      className="absolute left-2.5 right-2.5 bottom-7 sm:right-auto sm:w-[360px] z-[600] rounded-[16px] bg-[#FFFDF9] shadow-[0_2px_4px_rgba(19,25,31,0.08),0_12px_32px_-8px_rgba(19,25,31,0.35)] p-3"
    >
      <div className="flex gap-3">
        <img src={cafe.logoUrl || cafe.images[0]} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover bg-[#13191F]" />
        <div className="min-w-0 flex-1 pr-7 space-y-0.5">
          <h3 className="ios-headline text-[#13191F] truncate">{cafe.name}</h3>
          <p className="ios-footnote text-[#594C3D] line-clamp-2">{cafe.address || `${cafe.district}, ${cafe.city}`}</p>
          <p className="ios-footnote">
            {status === 'open' ? (
              <>
                <span className="font-medium text-[#3E5C48]">
                  Open until <span className="font-mono">{clockAfter(now, minutesLeft)}</span>
                </span>
                {minutesLeft <= CLOSING_SOON_MIN && (
                  <span className="text-[#8C3A2E]">
                    , closes in <span className="font-mono">{minutesLeft}</span> min
                  </span>
                )}
              </>
            ) : status === 'closed' ? (
              <>
                <span className="font-medium text-[#8C3A2E]">Closed now</span>
                <span className="text-[#594C3D]">
                  {today.open && today.close ? (
                    <>
                      {' '}
                      · today <span className="font-mono">{today.open}</span> to <span className="font-mono">{today.close}</span>
                    </>
                  ) : (
                    ' · closed all day today'
                  )}
                </span>
              </>
            ) : (
              <span className="font-medium text-[#594C3D]">Hours not listed</span>
            )}
          </p>
          {km !== null && (
            <p className="ios-footnote text-[#594C3D]">
              <span className="font-mono">{formatKm(km)}</span> away
              {km <= NEARBY_RADIUS_KM && (
                <>
                  , about <span className="font-mono">{walkMinutes(km)}</span> min walk
                </>
              )}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute top-1 right-1 h-11 w-11 flex items-center justify-center ios-press"
      >
        <span className="h-7 w-7 rounded-full bg-[#766046]/15 flex items-center justify-center text-[#594C3D]">
          <X className="w-3.5 h-3.5" strokeWidth={2.5} />
        </span>
      </button>
      <div className="flex gap-2 pt-3">
        {onDirections && (
          <button
            type="button"
            onClick={() => onDirections(cafe)}
            className="h-10 flex-1 px-4 rounded-full bg-[#906D4B] text-[#FFFDF9] text-[15px] font-semibold hover:bg-[#7D5C3D] inline-flex items-center justify-center gap-1.5 ios-press"
          >
            <Navigation className="w-4 h-4" />
            Get directions
          </button>
        )}
        <button
          type="button"
          onClick={() => onView(cafe.id)}
          className="h-10 flex-1 px-4 rounded-full ios-fill text-[15px] font-semibold text-[#7D5C3D] hover:bg-[#766046]/20 ios-press"
        >
          View details
        </button>
      </div>
    </div>
  );
};
