import React from 'react';
import { ChevronRight } from 'lucide-react';
import { MOODS, type MoodId } from './moods';
import { AyaMascot } from '../common/AyaMascot';

interface MoodCardProps {
  /** Opens the finder; a mood chip opens it with that mood already chosen. */
  onOpen: (mood: MoodId | null) => void;
}

/**
 * Discover entry point for the mood finder: warm linen inset card with a contained
 * Aya mascot vignette, clear typographic hierarchy, and responsive mood chips.
 */
export const MoodCard: React.FC<MoodCardProps> = ({ onOpen }) => (
  <section
    aria-labelledby="mood-card-title"
    data-tour="mood"
    className="bg-[#FFFDF9] rounded-2xl border border-[#594C3D]/10 ios-card-shadow p-4 sm:p-5"
  >
    {/* Header: Title, Subtitle, and Contained Aya Vignette */}
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 id="mood-card-title" className="text-[17px] sm:text-[18px] font-semibold text-[#13191F] tracking-tight">
          How are you feeling?
        </h2>
        <p className="text-[13px] sm:text-[13.5px] text-[#594C3D] leading-snug mt-0.5">
          Let Aya match a sanctuary to your mood.
        </p>
      </div>

      <div className="w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] rounded-full bg-[#FAF5EB] border border-[#E4D9C8]/80 flex items-center justify-center shrink-0 shadow-[inset_0_1px_2px_rgba(89,76,61,0.06)] overflow-hidden">
        <AyaMascot pose="mood" size={58} alt="Aya the Scout" />
      </div>
    </div>

    {/* Quick Mood Chips & Full Sheet Trigger */}
    <div className="mt-3.5 pt-3 border-t border-[#594C3D]/8 flex flex-wrap items-center gap-2">
      {MOODS.slice(0, 4).map((mood) => (
        <button
          key={mood.id}
          onClick={() => onOpen(mood.id)}
          className="h-8.5 px-3.5 rounded-full bg-[#FAF5EB] text-[13px] font-medium text-[#594C3D] hover:bg-[#906D4B] hover:text-[#FFFDF9] border border-[#594C3D]/8 transition-colors ios-press"
        >
          {mood.label}
        </button>
      ))}

      <button
        onClick={() => onOpen(null)}
        className="h-8.5 px-3 rounded-full text-[12.5px] font-semibold text-[#906D4B] hover:text-[#7D5C3D] inline-flex items-center gap-0.5 ios-press ml-auto"
      >
        All moods
        <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>
    </div>
  </section>
);

