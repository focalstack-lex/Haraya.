import { useCallback, useEffect, useRef, useState } from 'react';
import { distanceKm, type GeoPoint } from '../../utils/geo';
import { hasArrived, nextHeading, walkMinutesLeft, walkProgress } from './liveNavMath';

export interface LivePosition extends GeoPoint {
  /** Accuracy radius in metres. */
  accuracy: number;
  /** Degrees clockwise from north, or null before the visitor moves. */
  heading: number | null;
}

export type LiveNavStatus = 'idle' | 'locating' | 'active' | 'arrived' | 'denied' | 'unavailable';

export interface LiveNavigation {
  status: LiveNavStatus;
  position: LivePosition | null;
  remainingKm: number | null;
  minutesLeft: number | null;
  /** Share of the walk done since the first fix, 0 to 1. */
  progress: number;
  start: (target: GeoPoint) => void;
  stop: () => void;
}

/**
 * Walking navigation driven by navigator.geolocation.watchPosition with high accuracy. Positions stay in
 * memory for the session only: nothing is stored or sent anywhere. The watch is cleared on stop, on
 * arrival and on unmount so the GPS is not left running.
 */
export function useLiveNavigation(): LiveNavigation {
  const [status, setStatus] = useState<LiveNavStatus>('idle');
  const [position, setPosition] = useState<LivePosition | null>(null);
  const [remainingKm, setRemainingKm] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  const watchId = useRef<number | null>(null);
  const target = useRef<GeoPoint | null>(null);
  const startKm = useRef<number | null>(null);
  const last = useRef<LivePosition | null>(null);

  const clearWatch = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearWatch();
    target.current = null;
    startKm.current = null;
    last.current = null;
    setStatus('idle');
    setPosition(null);
    setRemainingKm(null);
    setProgress(0);
  }, [clearWatch]);

  const start = useCallback(
    (destination: GeoPoint) => {
      clearWatch();
      target.current = destination;
      startKm.current = null;
      last.current = null;
      setPosition(null);
      setRemainingKm(null);
      setProgress(0);

      if (!('geolocation' in navigator)) {
        setStatus('unavailable');
        return;
      }
      setStatus('locating');

      watchId.current = navigator.geolocation.watchPosition(
        (fix) => {
          const destinationNow = target.current;
          if (!destinationNow) return;
          const here = { lat: fix.coords.latitude, lng: fix.coords.longitude };
          const heading = nextHeading(
            fix.coords.heading ?? null,
            last.current,
            here,
            last.current?.heading ?? null
          );
          const next: LivePosition = { ...here, accuracy: fix.coords.accuracy, heading };
          const km = distanceKm(here, destinationNow);
          if (startKm.current === null) startKm.current = km;

          last.current = next;
          setPosition(next);
          setRemainingKm(km);
          setProgress(walkProgress(startKm.current, km));

          if (hasArrived(km)) {
            setStatus('arrived');
            clearWatch();
          } else {
            setStatus('active');
          }
        },
        (error) => {
          // Once there is a position, a timeout (walker standing still) or a brief signal loss (under an
          // awning, between buildings) is transient: the watch keeps running, so keep the last fix and wait.
          // Only a revoked permission ends the walk.
          if (error.code !== error.PERMISSION_DENIED && last.current !== null) return;
          console.warn('Haraya: live navigation location error', error.code, error.message);
          setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
          clearWatch();
        },
        { enableHighAccuracy: true, maximumAge: 2_000, timeout: 20_000 }
      );
    },
    [clearWatch]
  );

  useEffect(() => clearWatch, [clearWatch]);

  return {
    status,
    position,
    remainingKm,
    minutesLeft: remainingKm === null ? null : walkMinutesLeft(remainingKm),
    progress,
    start,
    stop,
  };
}
