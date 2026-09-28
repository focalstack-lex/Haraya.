import React, { useEffect, useState } from 'react';
import { AyaMascot } from '../common/AyaMascot';
import { elapsedSeconds, formatClock, useActiveFocusSession } from '../../hooks/useFocusSession';

interface FloatingFocusBannerProps {
  /** Opens the end-of-session sheet. */
  onFinish: () => void;
  /** Hidden while a sheet that owns the screen is open. */
  isHidden?: boolean;
}

/**
 * The running Deep Focus Session, floating just above the tab dock on phones (bottom of the screen on
 * desktop): Aya reading on the pill's edge, the spot name, a live HH:MM:SS timer with a pulsing steam dot,
 * and Finish. Tapping anywhere opens the end sheet; the session itself keeps running until it is saved.
 */
export const FloatingFocusBanner: React.FC<FloatingFocusBannerProps> = ({ onFinish, isHidden = false }) => {
  const session = useActiveFocusSession();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!session) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [session]);

  if (!session || isHidden) return null;
  const clock = formatClock(elapsedSeconds(session.startedAt, now));

  return (
    <div className="focus-banner-slot fixed inset-x-0 z-50 px-3 pointer-events-none">
      <div className="relative mx-auto max-w-md pointer-events-auto">
        <AyaMascot pose="focus" size={48} alt="" className="absolute left-2 -top-5 z-10 pointer-events-none" />
        <div
          role="status"
          aria-label={`Focus session at ${session.cafeName}, ${clock} elapsed`}
          className="h-[44px] rounded-full bg-[#13191F] text-[#FFFDF9] shadow-[0_4px_16px_rgba(0,0,0,0.2)] flex items-center"
        >
          <button
            onClick={onFinish}
            aria-label={`Open your focus session at ${session.cafeName}`}
            className="h-full min-w-0 flex-1 flex items-center gap-2.5 pl-[60px] pr-2 text-left rounded-l-full"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold leading-tight truncate">{session.cafeName}</span>
              <span className="block text-[11px] leading-tight text-[#FFFDF9]/64">Deep focus</span>
            </span>
            <span className="shrink-0 inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="focus-pulse absolute inset-0 rounded-full bg-[#E7AC67]" />
                <span className="relative h-2 w-2 rounded-full bg-[#E7AC67]" />
              </span>
              <span className="font-mono text-[14px] font-semibold tabular-nums">{clock}</span>
            </span>
          </button>
          <button
            onClick={onFinish}
            className="h-11 shrink-0 pr-1 pl-1 flex items-center rounded-r-full"
          >
            <span className="h-9 px-4 rounded-full bg-[#906D4B] hover:bg-[#7D5C3D] text-[#FFFDF9] text-[13px] font-semibold inline-flex items-center ios-press">
              Finish
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export interface ToastMessage {
  text: string;
  tone: 'success' | 'error';
}

interface SessionToastProps {
  message: ToastMessage | null;
  onDismiss: () => void;
  /** Sits higher when the focus banner is showing below it. */
  aboveBanner: boolean;
}

/** One line of feedback for session events (auto-save, stamp collected, errors). Dismisses itself. */
export const SessionToast: React.FC<SessionToastProps> = ({ message, onDismiss, aboveBanner }) => {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, 6000);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div
      className={`fixed inset-x-0 z-[70] px-3 pointer-events-none ${aboveBanner ? 'focus-toast-slot-raised' : 'focus-banner-slot'}`}
      aria-live="polite"
      role="status"
    >
      {message && (
        <button
          onClick={onDismiss}
          className="pointer-events-auto mx-auto max-w-md w-full min-h-11 px-4 py-2.5 rounded-[14px] bg-[#FFFDF9] ios-card-shadow text-left text-[14px] text-[#13191F] flex items-center gap-2.5"
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${message.tone === 'error' ? 'bg-[#8C3A2E]' : 'bg-[#3E5C48]'}`}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">{message.text}</span>
        </button>
      )}
    </div>
  );
};
