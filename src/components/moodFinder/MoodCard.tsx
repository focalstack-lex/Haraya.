import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { MOODS, type MoodId } from './moods';
import { AyaMascot, type AyaPose } from '../common/AyaMascot';
import { elapsedMinutes, type ActiveFocusSession } from '../../hooks/useFocusSession';
import { formatDuration } from '../../services/visitMapping';

interface MoodCardProps {
  /** Opens the finder; a mood chip opens it with that mood already chosen. */
  onOpen: (mood: MoodId | null) => void;
  /** The running focus session, if any: the card turns into its shortcut. */
  focusSession?: ActiveFocusSession | null;
  onFinishFocus?: () => void;
  onViewFocusSpot?: (cafeId: string) => void;
  /** No visits logged yet (and there are spots to stamp): Aya invites a first check-in. */
  passportEmpty?: boolean;
}

type CardState = 'focus' | 'late' | 'first' | 'default';

/** Late evening, when "open late" matters: 8 PM to 4 AM on the device clock. */
export function isLateEvening(date: Date): boolean {
  const hour = date.getHours();
  return hour >= 20 || hour < 4;
}

/** One state at a time, so Aya reads as a character reacting, not a slideshow. */
export function moodCardState(focusRunning: boolean, late: boolean, passportEmpty: boolean): CardState {
  if (focusRunning) return 'focus';
  if (late) return 'late';
  if (passportEmpty) return 'first';
  return 'default';
}

const POSE: Record<CardState, AyaPose> = {
  focus: 'focus',
  late: 'content',
  first: 'wander',
  default: 'mood',
};

/** Late evening puts the moods that suit it first; the rest keep their order. */
const LATE_FIRST: MoodId[] = ['focused', 'social', 'quick'];

/**
 * Discover entry point for the mood finder. Aya breaks out of the card's top edge on a cream halo (so her roast
 * body reads against the tint card), and she is the card's biggest tap target: tapping her opens the finder, or
 * the running session. What she says follows real state only: a focus session in progress, late evening, or an
 * empty passport; otherwise the mood question.
 */
export const MoodCard: React.FC<MoodCardProps> = ({ onOpen, focusSession = null, onFinishFocus, onViewFocusSpot, passportEmpty = false }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Minutes are enough for the card; the banner carries the live seconds
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const state = moodCardState(Boolean(focusSession), isLateEvening(now), passportEmpty);
  const moods = state === 'late'
    ? [...LATE_FIRST.map((id) => MOODS.find((mood) => mood.id === id)!), ...MOODS.filter((mood) => !LATE_FIRST.includes(mood.id))]
    : MOODS;

  const copy = (() => {
    switch (state) {
      case 'focus':
        return {
          title: `Focusing at ${focusSession!.cafeName}`,
          line: `${formatDuration(elapsedMinutes(focusSession!.startedAt, now.getTime()))} so far`,
          aya: `Aya is reading along. Open your focus session at ${focusSession!.cafeName}`,
        };
      case 'late':
        return { title: 'Late study tonight?', line: 'Ask Aya for a spot open late', aya: 'Ask Aya: open the mood finder' };
      case 'first':
        return { title: 'Your passport is empty', line: 'Tell Aya your mood, find a first spot', aya: 'Ask Aya: open the mood finder' };
      default:
        return { title: 'How are you feeling?', line: 'Ask Aya for more moods', aya: 'Ask Aya: open the mood finder' };
    }
  })();

  const tapAya = () => (state === 'focus' ? onFinishFocus?.() : onOpen(null));

  return (
    <section
      aria-labelledby="mood-card-title"
      data-tour="mood"
      className="relative mt-[40px] bg-[#906D4B] rounded-[20px] ios-card-shadow pt-3.5 pb-3.5"
    >
      <button
        type="button"
        onClick={tapAya}
        aria-label={copy.aya}
        className="absolute right-1 -top-[36px] z-20 w-[120px] h-[120px] aya-rise aya-tap"
      >
        {/* Cream halo behind the body: roast on tint is about 1.6:1, roast on cream is well above 3:1 */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-[30px] h-[100px] w-[100px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,246,238,0.95)_52%,rgba(255,246,238,0)_71%)]"
        />
        <AyaMascot key={state} pose={POSE[state]} size={120} alt="" className="relative" />
      </button>

      <div className="pl-4 pr-[124px] flex items-center gap-2 min-h-11">
        <h2 id="mood-card-title" className="ios-headline text-[#FFFDF9] leading-snug">
          {copy.title}
        </h2>
      </div>
      <div className="px-4 -mt-1 pr-[124px]">
        {state === 'focus' ? (
          <p className="min-h-11 -my-2 flex items-center text-[14px] font-medium text-[#FFFDF9]/90">{copy.line}</p>
        ) : (
          <button
            onClick={() => onOpen(null)}
            className="block min-h-11 -my-2 py-2.5 text-left text-[14px] leading-snug font-medium text-[#FFFDF9] ios-press"
          >
            {copy.line}
            {/* Inline so it stays with the last word when the line wraps */}
            <ChevronRight className="inline w-4 h-4 ml-0.5 -mt-0.5" strokeWidth={2.5} />
          </button>
        )}
      </div>

      <div className="relative z-10 ios-shelf gap-2 px-4 pt-3" style={{ scrollPaddingInline: 16 }}>
        {state === 'focus' ? (
          <>
            <button
              onClick={onFinishFocus}
              className="shrink-0 h-9 px-4 rounded-full bg-[#FFFDF9] text-[14px] font-semibold text-[#13191F] hover:bg-[#FAF5EB] ios-press"
            >
              Finish session
            </button>
            <button
              onClick={() => onViewFocusSpot?.(focusSession!.cafeId)}
              className="shrink-0 h-9 px-4 rounded-full bg-[#FFFDF9]/18 text-[14px] font-semibold text-[#FFFDF9] hover:bg-[#FFFDF9]/26 ios-press"
            >
              View spot
            </button>
          </>
        ) : (
          <>
            {moods.map((mood) => (
              <button
                key={mood.id}
                onClick={() => onOpen(mood.id)}
                className="shrink-0 h-9 px-4 rounded-full bg-[#FFFDF9] text-[14px] font-medium text-[#13191F] hover:bg-[#FAF5EB] ios-press"
              >
                {mood.label}
              </button>
            ))}
            {/* Trailing space so the last chip can scroll clear of the card edge */}
            <span aria-hidden="true" className="shrink-0 w-2" />
          </>
        )}
      </div>
    </section>
  );
};
