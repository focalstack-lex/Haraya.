import React, { useEffect, useRef, useState } from 'react';
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

/** Aya looks for the way while the first route of a walk is on its way. Her idle motion rests under reduced motion.
 *  The navigation card around it is the live region, so the two lines are announced as they change. */
export const RouteLoader: React.FC<{ phase: Exclude<RouteLoadPhase, null> }> = ({ phase }) => (
  <div className="flex items-center gap-3">
    <AyaMascot pose="wander" size={72} alt="" className="-my-1 shrink-0" />
    <div className="min-w-0">
      <p className="ios-headline text-[#13191F]">{COPY[phase].title}</p>
      <p className="ios-footnote text-[#594C3D]">{COPY[phase].line}</p>
    </div>
  </div>
);
