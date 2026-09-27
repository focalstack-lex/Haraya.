import React, { useEffect, useRef, useState } from 'react';
import { MapPin, ArrowUpRight, Flame } from 'lucide-react';
import type { Cafe } from '../../types/coffee';
import { isOpenNow } from '../../utils/calendar';

const ROTATE_MS = 6000;
const TICK_MS = 100;

interface EditorialHeroProps {
  /** Featured Davao roasteries; the hero cycles one every 6 seconds. */
  cafes: Cafe[];
  onSelectCafe: (cafeId: string) => void;
}

/**
 * Editorial hero banner: full-bleed photography of the featured roaster with a
 * 6-second auto-advancing progress rail. Pauses while the pointer is over it.
 */
export const EditorialHero: React.FC<EditorialHeroProps> = ({ cafes, onSelectCafe }) => {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const elapsedRef = useRef(0);

  const count = cafes.length;

  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = window.setInterval(() => {
      elapsedRef.current += TICK_MS;
      if (elapsedRef.current >= ROTATE_MS) {
        elapsedRef.current = 0;
        setIndex((current) => (current + 1) % count);
        setProgress(0);
      } else {
        setProgress(elapsedRef.current / ROTATE_MS);
      }
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  if (count === 0) return null;

  const featured = cafes[index % count];
  const openNow = isOpenNow(featured.hours);

  return (
    <section
      aria-label="Featured Davao roasters"
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#1A2225] text-[#FFF9E9] shadow-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="grid md:grid-cols-2">
        {/* Photography side */}
        <div className="relative h-56 sm:h-72 md:h-80 lg:h-96 overflow-hidden">
          {cafes.map((cafe, cafeIndex) => (
            <img
              key={cafe.id}
              src={cafe.images[0]}
              alt={`${cafe.name}, ${cafe.district}, ${cafe.city}`}
              loading={cafeIndex === 0 ? 'eager' : 'lazy'}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                cafeIndex === index % count ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent md:bg-gradient-to-r" />
        </div>

        {/* Editorial side */}
        <div className="relative p-5 sm:p-8 lg:p-10 flex flex-col justify-center gap-3 sm:gap-4">
          {/* 6-second progress rail */}
          <div className="flex gap-1.5" role="tablist" aria-label="Featured roasters">
            {cafes.map((cafe, cafeIndex) => (
              <button
                key={cafe.id}
                role="tab"
                aria-selected={cafeIndex === index % count}
                aria-label={`Show ${cafe.name}`}
                onClick={() => {
                  setIndex(cafes.indexOf(cafe));
                  elapsedRef.current = 0;
                  setProgress(0);
                }}
                className="hero-progress-segment h-1 flex-1 max-w-16 min-w-6"
              >
                <span
                  style={{
                    width: cafeIndex === index % count ? `${Math.round(progress * 100)}%` : cafeIndex < index % count ? '100%' : '0%',
                    transition: cafeIndex === index % count ? 'width 100ms linear' : 'none',
                  }}
                />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold font-sans tracking-widest uppercase text-[#FFF9E9]/80">
            <MapPin className="w-3.5 h-3.5 text-[#C86428]" />
            {featured.district}, {featured.city}
            {featured.isRoastery && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#C86428]/20 border border-[#C86428]/50 px-2 py-0.5 text-[9px] tracking-widest text-[#FFB477]">
                <Flame className="w-3 h-3" />
                Roastery
              </span>
            )}
          </div>

          <h1 className="font-cooper text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight tracking-tight">
            {featured.name}
          </h1>

          <p className="text-xs sm:text-sm font-sans text-[#FFF9E9]/80 leading-relaxed line-clamp-2">
            Signature pour: <span className="font-bold text-[#FFF9E9]">{featured.signature}</span>. {featured.description}
          </p>

          <div className="flex items-center gap-3 text-[11px] font-sans text-[#FFF9E9]/75">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border ${
              openNow ? 'border-[#FFF9E9]/25 bg-[#FFF9E9]/10' : 'border-[#FFF9E9]/15'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${openNow ? 'bg-[#7FB77E]' : 'bg-[#C86428]'}`} />
              {openNow ? 'Open Now' : 'Closed'}
            </span>
            <span>{'P'.repeat(featured.priceLevel)}</span>
            <span>{featured.saveCount.toLocaleString()} saves</span>
          </div>

          <div className="pt-1">
            <button
              onClick={() => onSelectCafe(featured.id)}
              className="h-10 px-5 rounded-full bg-[#FFF9E9] text-[#1A2225] text-xs font-bold font-sans inline-flex items-center gap-2 hover:bg-white transition-colors"
            >
              Inspect Roastery
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
