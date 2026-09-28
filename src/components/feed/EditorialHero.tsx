import React, { useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Cafe, RoastDrop } from '../../types/coffee';
import { catalogService } from '../../services/catalogService';
import { DropCountdownTimer } from '../drops/DropCountdownTimer';

interface EditorialHeroProps {
  cafes: Cafe[];
  drops: RoastDrop[];
  onSelectCafe: (cafeId: string) => void;
  onSelectRoastery: (cafeId: string) => void;
  onInspectBean: (beanId: string) => void;
}

interface HeroSlide {
  id: string;
  image: string;
  title: string;
  meta: string;
  /** One supporting line; empty on drop slides, where price takes the bottom row instead. */
  body: string;
  cta: string;
  /** Drop slides only: status in the photo corner and price beside the button. */
  drop?: { at: string; live: boolean; price: string; batch: string };
  onOpen: () => void;
}

const DAY_MS = 86_400_000;

const dropDay = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

/**
 * Featured shelf built from the live catalog: the next open roast drops first, then verified
 * micro-roasteries. Swipes with native scroll snapping; the page dots follow the scroll position.
 */
export const EditorialHero: React.FC<EditorialHeroProps> = ({ cafes, drops, onSelectCafe, onSelectRoastery, onInspectBean }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const slides = useMemo<HeroSlide[]>(() => {
    const dropSlides = drops
      .map((drop) => ({ drop, status: catalogService.getDropStatus(drop) }))
      .filter(({ status }) => status !== 'soldOut')
      .slice(0, 2)
      .map(({ drop, status }) => {
        const notes = catalogService.getBeanById(drop.beanId)?.tastingNotes.slice(0, 2).join(', ');
        return {
          id: drop.id,
          image: drop.coverImage,
          title: drop.title,
          meta: notes ? `${drop.roasterName} · ${notes}` : drop.roasterName,
          body: '',
          cta: 'View lot',
          drop: { at: drop.dropAt, live: status === 'live', price: `₱${drop.price} / bag`, batch: `${drop.batchBags}-bag batch` },
          onOpen: () => onInspectBean(drop.beanId),
        };
      });

    const cafeSlides = cafes.slice(0, 2).map((cafe) => ({
      id: cafe.id,
      image: cafe.images[0],
      title: cafe.name,
      meta: `${cafe.isRoastery ? 'Micro-roastery' : 'Cafe'} in ${cafe.district}, ${cafe.city}`,
      body: `Known for the ${cafe.signature}.`,
      cta: cafe.isRoastery ? 'View roastery' : 'View cafe',
      onOpen: () => (cafe.isRoastery ? onSelectRoastery(cafe.id) : onSelectCafe(cafe.id)),
    }));

    return [...dropSlides, ...cafeSlides];
  }, [cafes, drops, onInspectBean, onSelectCafe, onSelectRoastery]);

  if (slides.length === 0) return null;

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.round(track.scrollLeft / track.clientWidth);
    if (next !== index) setIndex(next);
  };

  const goTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
  };

  return (
    <section aria-label="Featured drops and roasteries" aria-roledescription="carousel" className="-mx-4 sm:mx-0">
      <div ref={trackRef} onScroll={handleScroll} style={{ scrollPaddingInline: 0 }} className="ios-shelf sm:rounded-[20px] sm:overflow-hidden">
        {slides.map((slide, i) => (
          <div key={slide.id} className="w-full shrink-0 px-4 sm:px-0" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`}>
            <button
              type="button"
              onClick={slide.onOpen}
              className="group relative block w-full aspect-[16/10] sm:aspect-[21/9] rounded-[20px] sm:rounded-none overflow-hidden bg-[#13191F] text-left ios-press active:scale-[0.985]"
            >
              <img
                src={slide.image}
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {slide.drop && (
                <span className="absolute top-3 left-3 sm:top-5 sm:left-8 inline-flex items-center h-7 px-2.5 rounded-full ios-material-dark z-[1]">
                  {slide.drop.live || new Date(slide.drop.at).getTime() - Date.now() < DAY_MS ? (
                    <DropCountdownTimer dropAt={slide.drop.at} compact onDark />
                  ) : (
                    <span className="text-[11px] font-medium text-[#FFFDF9]">Drops {dropDay.format(new Date(slide.drop.at))}</span>
                  )}
                </span>
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-[#13191F]/90 via-[#13191F]/25 to-transparent sm:bg-gradient-to-r sm:from-[#13191F]/85 sm:via-[#13191F]/35" />
              <span className="absolute inset-x-0 bottom-0 p-5 sm:p-8 sm:max-w-lg sm:top-0 sm:flex sm:flex-col sm:justify-end">
                <span className="block font-cooper text-[26px] sm:text-4xl font-bold leading-[1.08] text-[#FFFDF9] text-balance">
                  {slide.title}
                </span>
                <span className="block mt-1.5 text-[13px] sm:text-sm font-medium text-[#FFFDF9]/85 line-clamp-1">{slide.meta}</span>
                {slide.body && (
                  <span className="block mt-0.5 text-[13px] sm:text-sm text-[#FFFDF9]/70 line-clamp-1">{slide.body}</span>
                )}
                <span className="mt-3 sm:mt-4 flex items-center justify-between gap-3">
                  {slide.drop && (
                    <span className="min-w-0">
                      <span className="block text-[15px] font-mono font-semibold text-[#FFFDF9]">{slide.drop.price}</span>
                      <span className="block text-[12px] text-[#FFFDF9]/75">{slide.drop.batch}</span>
                    </span>
                  )}
                  <span className="shrink-0 inline-flex items-center gap-1 h-9 pl-4 pr-3 rounded-full bg-[#FFFDF9] text-[#13191F] text-[14px] font-semibold">
                    {slide.cta}
                    <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                  </span>
                </span>
              </span>
            </button>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-2 pt-3" role="tablist" aria-label="Featured slides">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              role="tab"
              aria-selected={index === i}
              aria-label={`Show slide ${i + 1}`}
              onClick={() => goTo(i)}
              className="h-6 min-w-5 flex items-center justify-center"
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  index === i ? 'w-5 bg-[#13191F]' : 'w-2 bg-[#13191F]/25'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
