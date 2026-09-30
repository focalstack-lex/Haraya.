import React, { useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Cafe } from '../../types/coffee';

interface EditorialHeroProps {
  /** Study & Work spots, already ranked by real saves. */
  studySpots: Cafe[];
  /** Approved community submissions, newest first. */
  hiddenGems: Cafe[];
  onSelectCafe: (cafeId: string) => void;
}

interface HeroSlide {
  id: string;
  image: string;
  title: string;
  meta: string;
  /** One supporting line: the signature drink or the contributor's tip. */
  body: string;
  onOpen: () => void;
}

/**
 * Spotlight shelf built only from real listings: the top study spots, then the newest hidden gems added
 * by the community. Nothing is shown until such listings exist. Swipes with native scroll snapping; the
 * page dots follow the scroll position.
 */
export const EditorialHero: React.FC<EditorialHeroProps> = ({ studySpots, hiddenGems, onSelectCafe }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const slides = useMemo<HeroSlide[]>(() => {
    const toSlide = (cafe: Cafe, kind: string, meta: string): HeroSlide => ({
      id: `${kind}-${cafe.id}`,
      image: cafe.images[0],
      title: cafe.name,
      meta,
      body: cafe.community?.tip || (cafe.signature ? `Known for the ${cafe.signature}.` : ''),
      onOpen: () => onSelectCafe(cafe.id),
    });
    const gemIds = new Set(hiddenGems.map((cafe) => cafe.id));
    return [
      ...studySpots
        .filter((cafe) => !gemIds.has(cafe.id))
        .slice(0, 2)
        .map((cafe) => toSlide(cafe, 'study', `Top study spot in ${cafe.district}, ${cafe.city}`)),
      ...hiddenGems.slice(0, 2).map((cafe) => toSlide(cafe, 'gem', `Hidden gem in ${cafe.district}, added by a local`)),
    ];
  }, [studySpots, hiddenGems, onSelectCafe]);

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
    <section aria-label="Featured study spots and hidden gems" aria-roledescription="carousel" className="-mx-4 sm:mx-0">
      <div ref={trackRef} onScroll={handleScroll} style={{ scrollPaddingInline: 0 }} className="ios-shelf sm:rounded-card sm:overflow-hidden">
        {slides.map((slide, i) => (
          <div key={slide.id} className="w-full shrink-0 px-4 sm:px-0" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`}>
            <button
              type="button"
              onClick={slide.onOpen}
              className="group relative block w-full aspect-[16/10] sm:aspect-[21/9] rounded-card sm:rounded-none overflow-hidden bg-ink text-left ios-press active:scale-[0.985]"
            >
              <img
                src={slide.image}
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent sm:bg-gradient-to-r sm:from-ink/85 sm:via-ink/35" />
              <span className="absolute inset-x-0 bottom-0 p-5 sm:p-8 sm:max-w-lg sm:top-0 sm:flex sm:flex-col sm:justify-end">
                <span className="block font-cooper text-[26px] sm:text-4xl font-bold leading-[1.08] text-surface text-balance">
                  {slide.title}
                </span>
                <span className="block mt-1.5 text-[13px] sm:text-sm font-medium text-surface/85 line-clamp-1">{slide.meta}</span>
                {slide.body && (
                  <span className="block mt-0.5 text-[13px] sm:text-sm text-surface/70 line-clamp-1">{slide.body}</span>
                )}
                <span className="mt-3 sm:mt-4 flex items-center">
                  <span className="shrink-0 inline-flex items-center gap-1 h-9 pl-4 pr-3 rounded-full bg-surface text-ink text-[14px] font-semibold">
                    View spot
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
                  index === i ? 'w-5 bg-ink' : 'w-2 bg-ink/25'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
