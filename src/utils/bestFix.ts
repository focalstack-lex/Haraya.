import type { GeoPoint } from './geo';
import { isBetterFix } from './locationQuality';

export interface Fix extends GeoPoint {
  /** Accuracy radius in metres, as the device reports it (locationQuality.ts says what the sizes mean). */
  accuracy: number;
}

export type FixFailure = 'denied' | 'unavailable';

export interface BestFixOptions {
  highAccuracy: boolean;
  /** Oldest cached fix the browser may answer with first. */
  maximumAgeMs: number;
  /** How long to wait for any fix before giving up. */
  timeoutMs: number;
  /** After the first fix, how long to keep listening for a tighter one. */
  windowMs: number;
  /** Stops listening early once the fix held passes this. */
  isGoodEnough: (best: Fix) => boolean;
  /** Each time a tighter fix replaces the one held (the first fix included). */
  onFix: (best: Fix) => void;
  /** Once, when listening stops with a fix held. */
  onSettled: (best: Fix) => void;
  /** Once, when listening stops without a fix, or when the permission is refused. */
  onError: (failure: FixFailure) => void;
  /** The browser's by default; tests pass their own. */
  geolocation?: Geolocation;
}

/** GeolocationPositionError.PERMISSION_DENIED */
const PERMISSION_DENIED = 1;

/**
 * The first answer to a GPS request is usually the phone's last network fix, a kilometre or two wide (a town
 * away when precise location is off), with the real GPS fix following seconds later. This listens on
 * watchPosition, keeps the tightest fix, and stops once it is good enough or the window after the first fix
 * closes. A timeout or a dropout after a fix only means the GPS went quiet for a moment, so it keeps the fix
 * held and listens on. Returns a cancel function that stops listening without calling back. Nothing is stored.
 */
export function watchBestFix(options: BestFixOptions): () => void {
  const geolocation = options.geolocation ?? navigator.geolocation;
  let best: Fix | null = null;
  let done = false;
  let watchId: number | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const stop = () => {
    done = true;
    if (watchId !== null) geolocation.clearWatch(watchId);
    watchId = null;
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  const settle = () => {
    if (done) return;
    stop();
    if (best) options.onSettled(best);
  };

  watchId = geolocation.watchPosition(
    (position) => {
      if (done) return;
      const next: Fix = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy };
      if (isBetterFix(best, next)) {
        best = next;
        options.onFix(next);
      }
      if (done || !best) return;
      if (options.isGoodEnough(best)) settle();
      else if (timer === undefined) timer = setTimeout(settle, options.windowMs);
    },
    (error) => {
      if (done) return;
      if (best !== null && error.code !== PERMISSION_DENIED) return;
      stop();
      options.onError(error.code === PERMISSION_DENIED ? 'denied' : 'unavailable');
    },
    { enableHighAccuracy: options.highAccuracy, timeout: options.timeoutMs, maximumAge: options.maximumAgeMs }
  );
  // A callback that ran before watchPosition returned could not clear the watch yet
  if (done && watchId !== null) {
    geolocation.clearWatch(watchId);
    watchId = null;
  }

  return stop;
}
