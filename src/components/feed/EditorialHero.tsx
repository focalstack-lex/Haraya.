import React, { useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Cafe, RoastDrop } from '../../types/coffee';
import { catalogService } from '../../services/catalogService';

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
  body: string;
  cta: string;
  onOpen: () => void;
}

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
      .map(({ drop, status }) => ({
        id: drop.id,
        image: drop.coverImage,
        title: drop.title,
        meta:
          status === 'live'
            ? `Roast drop, live now from ${drop.roasterName}`
            : `Roast drop, ${dropDay.format(new Date(drop.dropAt))} from ${drop.roasterName}`,
        body: `${drop.batchBags} bags at ₱${drop.price} each.`,
        cta: 'View lot',
        onOpen: () => onInspectBean(drop.beanId),
      }));

    const cafeSlides = cafes.slice(0, 2).map((cafe) => ({
      id: cafe.id,
      image: cafe.images[0],
      title: cafe.name,
      meta: `${cafe.isRoastery ? 'Micro-roastery' : 'Cafe'} in ${cafe.district}, ${cafe.city}`,
      body: `Known for the ${cafe.signature}.`,
      cta: cafe.isRoastery ? 'Open roastery' : 'View cafe',
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
              className="group relative block w-full aspect-[4/3] sm:aspect-[21/9] rounded-[20px] sm:rounded-none overflow-hidden bg-[#13191F] text-left ios-press active:scale-[0.985]"
            >
              <img
                src={slide.image}
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-[#13191F]/90 via-[#13191F]/25 to-transparent sm:bg-gradient-to-r sm:from-[#13191F]/85 sm:via-[#13191F]/35" />
              <span className="absolute inset-x-0 bottom-0 p-5 sm:p-8 sm:max-w-lg sm:top-0 sm:flex sm:flex-col sm:justify-end">
                <span className="block font-cooper text-[26px] sm:text-4xl font-bold leading-[1.08] text-[#FFFDF9] text-balance">
                  {slide.title}
                </span>
                <span className="block mt-1.5 text-[13px] sm:text-sm font-medium text-[#FFFDF9]/85">{slide.meta}</span>
                <span className="block mt-0.5 text-[13px] sm:text-sm text-[#FFFDF9]/70 line-clamp-1">{slide.body}</span>
                <span className="mt-4 self-start w-fit inline-flex items-center gap-1 h-9 pl-4 pr-3 rounded-full ios-material-dark text-[#FFFDF9] text-[14px] font-semibold">
                  {slide.cta}
                  <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
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
              className="h-6 w-4 flex items-center justify-center"
            >
              <span
                className={`block h-[7px] w-[7px] rounded-full transition-colors duration-300 ${
                  index === i ? 'bg-[#13191F]' : 'bg-[#13191F]/20'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
