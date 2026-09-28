import React from 'react';
import { ChevronRight } from 'lucide-react';
import { MOODS, type MoodId } from './moods';
import { AyaMascot } from '../common/AyaMascot';

interface MoodCardProps {
  /** Opens the finder; a mood chip opens it with that mood already chosen. */
  onOpen: (mood: MoodId | null) => void;
}

/**
 * Discover entry point for the mood finder: one question and the four most common moods.
 * Aya breaks out of the card's top edge (her ears sit on the page canvas), rises in once on
 * mount (`aya-rise` in index.css), then idles through AyaMascot's own bob, blink and heart steam.
 */
export const MoodCard: React.FC<MoodCardProps> = ({ onOpen }) => (
  <section
    aria-labelledby="mood-card-title"
    data-tour="mood"
    className="relative mt-[52px] bg-[#906D4B] rounded-[20px] ios-card-shadow pt-3.5 pb-3.5"
  >
    <div className="absolute right-1 -top-[44px] pointer-events-none aya-rise">
      <AyaMascot pose="mood" size={120} alt="" />
    </div>

    <div className="pl-4 pr-[124px] flex items-center gap-2 min-h-11">
      <h2 id="mood-card-title" className="ios-headline text-[#FFFDF9]">
        How are you feeling?
      </h2>
    </div>
    <div className="px-4 -mt-1 pr-[124px]">
      <button
        onClick={() => onOpen(null)}
        className="inline-flex items-center gap-0.5 min-h-11 -my-2 text-[14px] font-medium text-[#FFFDF9] ios-press"
      >
        Ask Aya for more moods
        <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
    <div className="relative z-10 ios-shelf gap-2 px-4 pt-3" style={{ scrollPaddingInline: 16 }}>
      {MOODS.slice(0, 4).map((mood) => (
        <button
          key={mood.id}
          onClick={() => onOpen(mood.id)}
          className="shrink-0 h-9 px-4 rounded-full bg-[#FFFDF9] text-[14px] font-medium text-[#13191F] hover:bg-[#FAF5EB] ios-press"
        >
          {mood.label}
        </button>
      ))}
    </div>
  </section>
);
