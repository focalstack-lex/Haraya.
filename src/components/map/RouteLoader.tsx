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
export function useHeldPhase(phase: RouteLoadPhase): RouteLoadPhase {
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
    const wait = Math.max(0, MIN_LOADER_MS - (Date.now() - shownSince.current));
    const timer = window.setTimeout(() => {
      shownSince.current = null;
      setShown(null);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return shown;
}

/** The wait in words, inside the navigation card. Aya herself is on the map (MapAyaOverlay), so she is not repeated
 *  here. The card around it is the live region, so the line is announced as it changes. */
export const RouteLoader: React.FC<{ phase: Exclude<RouteLoadPhase, null> }> = ({ phase }) => (
  <p className="ios-footnote text-ink-2">{COPY[phase].line}</p>
);

/** How long Aya celebrates once the wait ends well, before the map is handed back. */
const FOUND_MS = 1100;

const FOUND_COPY: Record<Exclude<RouteLoadPhase, null>, { title: string; line: string }> = {
  locating: { title: 'Found you', line: 'Here are the spots around you.' },
  routing: { title: 'Off you go', line: 'Your walk is on the map.' },
};

type OverlayStage = { kind: 'loading' | 'found'; phase: Exclude<RouteLoadPhase, null> } | null;

/**
 * Aya over the whole map while the location or the first route is on its way: the map blurs behind her, she looks
 * for the way, and when the answer arrives she cheers for a moment and leaves. A wait that ends badly (location
 * blocked or unavailable) just clears, because the message under the map explains it. The visitor can also wave
 * her off and browse the map while waiting.
 */
export const MapAyaOverlay: React.FC<{ phase: RouteLoadPhase; succeeded: boolean }> = ({ phase, succeeded }) => {
  const [stage, setStage] = useState<OverlayStage>(phase ? { kind: 'loading', phase } : null);
  const [dismissed, setDismissed] = useState(false);
  const lastPhase = useRef<RouteLoadPhase>(phase);
  // Read when the wait ends, without restarting the celebration if it changes afterwards
  const succeededRef = useRef(succeeded);
  succeededRef.current = succeeded;

  useEffect(() => {
    const previous = lastPhase.current;
    lastPhase.current = phase;
    if (phase) {
      // A new wait brings Aya back even if the last one was waved off
      if (!previous) setDismissed(false);
      setStage({ kind: 'loading', phase });
      return;
    }
    if (!previous || !succeededRef.current) {
      setStage(null);
      return;
    }
    setStage({ kind: 'found', phase: previous });
    const timer = window.setTimeout(() => setStage(null), FOUND_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const copy = stage ? (stage.kind === 'found' ? FOUND_COPY[stage.phase] : COPY[stage.phase]) : null;

  return (
    <AnimatePresence>
      {stage && copy && !dismissed && (
        <motion.div
          key="aya-overlay"
          role="status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 z-[600] flex flex-col items-center justify-center gap-1 px-6 text-center bg-canvas/60 backdrop-blur-sm"
        >
          {/* The key restarts her entrance when the pose changes, so the cheer reads as a reaction */}
          <div key={stage.kind} className="aya-rise">
            <AyaMascot pose={stage.kind === 'found' ? 'arrive' : 'wander'} size={128} alt="" />
          </div>
          <p className="ios-headline text-ink">{copy.title}</p>
          <p className="ios-footnote text-ink-2">{copy.line}</p>
          {stage.kind === 'loading' && (
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
