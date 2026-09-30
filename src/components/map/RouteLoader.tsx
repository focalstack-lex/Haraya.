import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AyaMascot } from '../common/AyaMascot';
import { MIN_LOADER_MS, type RouteLoadPhase } from './routeLoadPhase';

const COPY: Record<Exclude<RouteLoadPhase, null>, { title: string; line: string }> = {
  locating: { title: 'Finding you', line: 'Waiting for your location.' },
  routing: { title: 'Aya is mapping your walk', line: 'Looking for the best streets to take.' },
};

/**
 * Holds a loading phase on screen for at least MIN_LOADER_MS after it first appears, so a quick answer does not
 * flash the loader. Returns the phase to show, or null when the loader should be gone.
 */
export function useHeldPhase(phase: RouteLoadPhase, minMs: number = MIN_LOADER_MS): RouteLoadPhase {
  const [shown, setShown] = useState<RouteLoadPhase>(phase);
  const shownSince = useRef<number | null>(phase ? Date.now() : null);

  useEffect(() => {
    if (phase) {
      if (shownSince.current === null) shownSince.current = Date.now();
      setShown(phase);
      return;
    }
    if (shownSince.current === null) {
      setShown(null);
      return;
    }
    const wait = Math.max(0, minMs - (Date.now() - shownSince.current));
    const timer = window.setTimeout(() => {
      shownSince.current = null;
      setShown(null);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [phase, minMs]);

  return shown;
}

/** The wait in words, inside the navigation card. Aya herself is on the map (MapAyaOverlay), so she is not repeated
 *  here. The card around it is the live region, so the line is announced as it changes. */
export const RouteLoader: React.FC<{ phase: Exclude<RouteLoadPhase, null> }> = ({ phase }) => (
  <p className="ios-footnote text-ink-2">{COPY[phase].line}</p>
);

const FOUND_COPY: Record<Exclude<RouteLoadPhase, null>, { title: string; line: string }> = {
  locating: { title: 'Found you', line: 'Here is the map around you.' },
  routing: { title: 'Off you go', line: 'Your walk is on the map.' },
};

/** Aya's search stays on the map at least this long, so even an instant GPS fix gets its moment. */
export const MIN_OVERLAY_MS = 1500;
/** How long Aya celebrates once the wait ends well, before the map is handed back. */
const FOUND_MS = 1100;
/** Later waits in the same visit are kept brief: the moment has been had, and the map is opened often. */
const REPEAT_FOUND_MS = 700;
/** Past this, the wait is clearly a slow GPS and Aya says so. */
const SLOW_MS = 7000;
/** Aya fades in after this pause, so a wait that fails at once (location blocked) never flashes her on screen. */
const APPEAR_DELAY_S = 0.12;

const SLOW_COPY = { title: 'Still looking', line: 'GPS can be slow indoors. A spot near a window helps.' };

/** True once Aya has cheered in this visit to the site; later waits use the shorter timings. */
let cheeredOnce = false;

type OverlayStage = { kind: 'loading' | 'found'; phase: Exclude<RouteLoadPhase, null> } | null;

interface MapAyaOverlayProps {
  /** What the map is waiting for right now; null when nothing. */
  phase: RouteLoadPhase;
  /** Whether the wait that just ended got its answer. Read at the moment `phase` turns null. */
  succeeded: boolean;
  /** The line under "Found you", from what the fix actually turned up. Falls back to a neutral line. */
  foundLine?: string;
}

/**
 * Aya over the whole map while the location or the first route is on its way: the map blurs behind her, a ring
 * pulses out from her while she looks, and when the answer arrives she cheers for a moment and leaves. The search
 * stays up for a minimum time, so a fast fix still reads as a search. A wait that ends badly (location blocked
 * or unavailable) clears at once, because the message under the map explains it and Aya should not claim to be
 * searching. The visitor can also wave her off and browse the map while waiting.
 */
export const MapAyaOverlay: React.FC<MapAyaOverlayProps> = ({ phase, succeeded, foundLine }) => {
  const [stage, setStage] = useState<OverlayStage>(phase ? { kind: 'loading', phase } : null);
  const [dismissed, setDismissed] = useState(false);
  const [slow, setSlow] = useState(false);
  const lastPhase = useRef<RouteLoadPhase>(phase);
  const shownSince = useRef<number | null>(phase ? Date.now() : null);
  // Read when the wait ends, without restarting the celebration if they change afterwards
  const succeededRef = useRef(succeeded);
  succeededRef.current = succeeded;

  useEffect(() => {
    const previous = lastPhase.current;
    lastPhase.current = phase;
    if (phase) {
      if (!previous) {
        // A new wait brings Aya back even if the last one was waved off
        setDismissed(false);
        setSlow(false);
        shownSince.current = Date.now();
      }
      setStage({ kind: 'loading', phase });
      const slowTimer = window.setTimeout(() => setSlow(true), Math.max(0, SLOW_MS - (Date.now() - (shownSince.current ?? Date.now()))));
      return () => window.clearTimeout(slowTimer);
    }
    const since = shownSince.current;
    shownSince.current = null;
    if (!previous || since === null || !succeededRef.current) {
      setStage(null);
      return;
    }
    const minMs = cheeredOnce ? MIN_LOADER_MS : MIN_OVERLAY_MS;
    const foundMs = cheeredOnce ? REPEAT_FOUND_MS : FOUND_MS;
    let leaveTimer: number | undefined;
    const cheerTimer = window.setTimeout(() => {
      cheeredOnce = true;
      setStage({ kind: 'found', phase: previous });
      leaveTimer = window.setTimeout(() => setStage(null), foundMs);
    }, Math.max(0, minMs - (Date.now() - since)));
    return () => {
      window.clearTimeout(cheerTimer);
      window.clearTimeout(leaveTimer);
    };
  }, [phase]);

  const found = stage?.kind === 'found';
  const copy = !stage
    ? null
    : found
      ? { title: FOUND_COPY[stage.phase].title, line: (stage.phase === 'locating' && foundLine) || FOUND_COPY[stage.phase].line }
      : slow && stage.phase === 'locating'
        ? SLOW_COPY
        : COPY[stage.phase];

  return (
    <AnimatePresence>
      {stage && copy && !dismissed && (
        <motion.div
          key="aya-overlay"
          role="status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.25, delay: APPEAR_DELAY_S } }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="absolute inset-0 z-[600] flex flex-col items-center justify-center gap-1 px-6 text-center bg-canvas/70 backdrop-blur-md"
        >
          <div className="relative">
            {!found && (
              <>
                <span className="aya-ping" aria-hidden="true" />
                <span className="aya-ping aya-ping-late" aria-hidden="true" />
              </>
            )}
            {/* The key restarts her entrance when the pose changes, so the cheer reads as a reaction */}
            <div key={stage.kind} className="relative aya-rise">
              <AyaMascot pose={found ? 'arrive' : 'wander'} size={128} alt="" />
            </div>
          </div>
          <p className="ios-headline text-ink">{copy.title}</p>
          <p className="ios-footnote text-ink-2 max-w-[30ch]">{copy.line}</p>
          {!found && (
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="mt-2 h-11 px-4 rounded-full ios-fill text-[14px] font-semibold text-tint-ink ios-press"
            >
              Browse the map
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
