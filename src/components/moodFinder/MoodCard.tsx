import React, { useEffect, useState } from 'react';
import type { MoodId } from './moods';
import { AyaMascot } from '../common/AyaMascot';
import { elapsedMinutes, type ActiveFocusSession } from '../../hooks/useFocusSession';
import { formatDuration } from '../../services/visitMapping';

interface MoodCardProps {
  /** Opens the mood finder (null: no mood chosen yet, the visitor picks one in the sheet). */
  onOpen: (mood: MoodId | null) => void;
  /** The running focus session, if any: the card turns into its shortcut. */
  focusSession?: ActiveFocusSession | null;
  onFinishFocus?: () => void;
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

/**
 * Discover entry point for the mood finder, laid out like a profile card: a title, one short line and a single pill
 * button that opens the finder (the moods themselves live in the sheet). Aya stands at the right edge like a
 * portrait, cut off by the card's bottom edge, with her ears breaking out above the card's top. She keeps her one
 * `mood` pose (cup with heart steam) and no glow. The copy and button follow real state only: a focus session in
 * progress, late evening, or an empty passport; otherwise the mood question.
 */
export const MoodCard: React.FC<MoodCardProps> = ({ onOpen, focusSession = null, onFinishFocus, passportEmpty = false }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Minutes are enough for the card; the banner carries the live seconds
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const state = moodCardState(Boolean(focusSession), isLateEvening(now), passportEmpty);

  const copy = (() => {
    switch (state) {
      case 'focus':
        return {
          title: `Focusing at ${focusSession!.cafeName}`,
          line: `${formatDuration(elapsedMinutes(focusSession!.startedAt, now.getTime()))} so far`,
          action: 'Finish session',
          aya: `Open your focus session at ${focusSession!.cafeName}`,
        };
      case 'late':
        return { title: 'Late study tonight?', line: 'Aya knows which spots are still open.', action: 'Find a late spot', aya: 'Ask Aya: open the mood finder' };
      case 'first':
        return { title: 'Your passport is empty', line: 'Tell Aya your mood and find a first spot.', action: 'Pick a mood', aya: 'Ask Aya: open the mood finder' };
      default:
        return { title: 'How are you feeling?', line: 'Tell Aya your mood and she picks spots that fit.', action: 'Pick a mood', aya: 'Ask Aya: open the mood finder' };
    }
  })();

  const act = () => (state === 'focus' ? onFinishFocus?.() : onOpen(null));

  return (
    <section
      aria-labelledby="mood-card-title"
      data-tour="mood"
      className="relative mt-[46px] min-h-[136px] bg-[#FFFDF9] rounded-[20px] ios-card-shadow"
    >
      {/* Portrait frame: starts 42px above the card so the ears break out whole, and clips at the card's bottom edge
          (same 20px corner) so Aya reads as standing behind it, like the photo in a profile card. Above the text
          layer so she stays tappable; the frame itself lets taps through. */}
      <div className="absolute z-10 right-0 -top-[42px] bottom-0 w-[160px] overflow-hidden rounded-br-[20px] pointer-events-none">
        <button
          type="button"
          onClick={act}
          aria-label={copy.aya}
          className="absolute -left-[8px] top-0 w-[176px] h-[176px] pointer-events-auto aya-rise aya-tap"
        >
          <AyaMascot pose="mood" size={176} alt="" />
        </button>
      </div>

      <div className="relative pl-4 pr-[148px] pt-4 pb-4">
        <h2 id="mood-card-title" className="ios-headline text-[#13191F] leading-snug">
          {copy.title}
        </h2>
        <p className="mt-1 text-[13px] leading-snug text-[#594C3D]">{copy.line}</p>
        <button
          onClick={act}
          className="mt-3 h-[36px] px-4 rounded-full bg-[#906D4B] text-[14px] font-semibold text-[#FFFDF9] hover:bg-[#7D5C3D] ios-press"
        >
          {copy.action}
        </button>
      </div>
    </section>
  );
};
