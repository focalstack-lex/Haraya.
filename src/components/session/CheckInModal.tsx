import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navigation, RotateCw, LocateFixed } from 'lucide-react';
import type { Cafe } from '../../types/coffee';
import { Modal, ModalHeader, PrimaryButton, SecondaryButton, ErrorNote } from '../common/FormControls';
import { AyaMascot } from '../common/AyaMascot';
import { FocusTimerIcon, RubberStampIcon } from '../common/CustomIcons';
import { PassportStamp } from '../passport/PassportStamp';
import { calculateDistanceMeters, CHECK_IN_RADIUS_M, formatKm, type GeoPoint } from '../../utils/geo';
import { watchBestFix, type Fix } from '../../utils/bestFix';
import { checkInVerdict, fixQuality, formatAccuracy, isDecisiveForCheckIn, REFINE_WINDOW_MS } from '../../utils/locationQuality';
import { LocationHelp } from '../common/LocationHelp';
import { focusSessionStore, useActiveFocusSession } from '../../hooks/useFocusSession';
import { visitService } from '../../services/visitService';
import { sessionService } from '../../services/sessionService';
import { VISIT_LIMITS } from '../../services/visitMapping';

interface CheckInModalProps {
  cafe: Cafe | null;
  onClose: () => void;
  onDirections: (cafe: Cafe) => void;
  /** A focus session just started; the caller closes the sheets so the banner shows. */
  onFocusStarted: () => void;
  /** Opens the end sheet for the session already running. */
  onFinishActive: () => void;
  onOpenPassport: () => void;
}

type Phase =
  /** fix: the widest-yet fix while a tighter one is awaited, or null before the first */
  | { kind: 'locating'; fix: Fix | null }
  | { kind: 'denied' }
  | { kind: 'unavailable' }
  /** The best fix was too wide to say whether the device is at the spot */
  | { kind: 'unsure'; fix: Fix; distance: number }
  | { kind: 'located'; device: GeoPoint; distance: number }
  | { kind: 'stamped'; stampedAt: string; synced: boolean };

/**
 * Check in at a spot. The device position is read in memory and compared with the spot: within 120 m the
 * visitor can start a Deep Focus Session or take a Quick Stamp; farther away the sheet shows the distance and
 * offers directions instead. Aya cheers on arrival and holds up a map pin when it is too far. The first answer
 * on a phone is often a network fix kilometres wide, so the sheet listens until a fix settles it
 * (isDecisiveForCheckIn) or the wait ends, and says the fix is too wide rather than "you are 2 km away" when it
 * cannot tell.
 */
export const CheckInModal: React.FC<CheckInModalProps> = ({ cafe, onClose, onDirections, onFocusStarted, onFinishActive, onOpenPassport }) => {
  const active = useActiveFocusSession();
  const [phase, setPhase] = useState<Phase>({ kind: 'locating', fix: null });
  const cancelFix = useRef<(() => void) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const locate = useCallback(() => {
    if (!cafe) return;
    setError(null);
    cancelFix.current?.();
    cancelFix.current = null;
    if (!('geolocation' in navigator)) {
      setPhase({ kind: 'unavailable' });
      return;
    }
    setPhase({ kind: 'locating', fix: null });
    const distanceTo = (fix: Fix) => calculateDistanceMeters(fix.lat, fix.lng, cafe.lat, cafe.lng);
    cancelFix.current = watchBestFix({
      highAccuracy: true,
      // Always a fresh fix: a cached one could still say "far away" after the visitor walks up
      maximumAgeMs: 0,
      timeoutMs: 15_000,
      windowMs: REFINE_WINDOW_MS,
      isGoodEnough: (fix) => isDecisiveForCheckIn(distanceTo(fix), fix.accuracy),
      onFix: (fix) => setPhase({ kind: 'locating', fix }),
      onSettled: (fix) => {
        cancelFix.current = null;
        const distance = distanceTo(fix);
        setPhase(
          checkInVerdict(distance, fix.accuracy) === 'unsure'
            ? { kind: 'unsure', fix, distance }
            : { kind: 'located', device: { lat: fix.lat, lng: fix.lng }, distance }
        );
      },
      onError: (failure) => {
        cancelFix.current = null;
        setPhase({ kind: failure });
      },
    });
  }, [cafe]);

  useEffect(() => {
    if (cafe) locate();
    // Closing the sheet or switching spots stops the GPS
    return () => {
      cancelFix.current?.();
      cancelFix.current = null;
    };
  }, [cafe, locate]);

  if (!cafe) return null;

  const signedIn = Boolean(sessionService.getUser());

  const startFocus = () => {
    if (phase.kind !== 'located') return;
    focusSessionStore.start(cafe, phase.device);
    onFocusStarted();
  };

  const quickStamp = async () => {
    if (phase.kind !== 'located') return;
    setBusy(true);
    setError(null);
    try {
      const { visit, synced } = await visitService.recordVisit({
        cafe,
        sessionType: 'stamp',
        durationMinutes: VISIT_LIMITS.stampMinutes,
        isPublic: signedIn && visitService.isPassportPublic(),
        device: phase.device,
        distanceMeters: phase.distance,
      });
      setPhase({ kind: 'stamped', stampedAt: visit.createdAt, synced });
    } catch (stampError) {
      setError(stampError instanceof Error ? stampError.message : 'Could not collect the stamp.');
    } finally {
      setBusy(false);
    }
  };

  const body = (() => {
    switch (phase.kind) {
      case 'locating':
        return (
          <div className="py-10 flex flex-col items-center gap-3 text-center" aria-live="polite">
            <LocateFixed className="w-7 h-7 text-tint animate-pulse" />
            <p className="text-[15px] text-ink-2">Checking where you are...</p>
            {phase.fix && (
              <p className="ios-footnote text-ink-2">Getting a precise fix, {formatAccuracy(phase.fix.accuracy)} so far.</p>
            )}
          </div>
        );
      case 'unsure':
        return (
          <div className="py-4 flex flex-col items-center gap-3 text-center">
            <AyaMascot pose="wander" size={112} alt="" />
            <h3 className="ios-title text-[19px] text-ink">Can't confirm you're here yet</h3>
            <p className="text-[14px] text-ink-2 max-w-xs">
              Check-ins open within <span className="font-mono">{CHECK_IN_RADIUS_M} m</span> of {cafe.name}, and your
              location is only accurate to {formatAccuracy(phase.fix.accuracy)}.
            </p>
            <div className="w-full rounded-row bg-canvas px-4 py-3 text-left">
              {fixQuality(phase.fix.accuracy) === 'precise' ? (
                // Precise location is on but the GPS has not locked on (indoors, on Wi-Fi): a window helps, settings do not
                <p className="ios-footnote text-ink-2">
                  Your phone is placing you by Wi-Fi, not GPS. Step near a window or the door for a few seconds, then Check again.
                </p>
              ) : (
                <LocationHelp problem={fixQuality(phase.fix.accuracy) === 'rough' ? 'rough' : 'approximate'} accuracyM={phase.fix.accuracy} />
              )}
            </div>
            <div className="w-full flex flex-col sm:flex-row gap-2 pt-1">
              <PrimaryButton onClick={locate} className="inline-flex items-center justify-center gap-2 w-full sm:flex-1">
                <RotateCw className="w-4 h-4" />
                Check again
              </PrimaryButton>
              <SecondaryButton onClick={() => onDirections(cafe)} className="inline-flex items-center justify-center gap-2 w-full sm:flex-1">
                <Navigation className="w-4 h-4" />
                Get directions
              </SecondaryButton>
            </div>
          </div>
        );
      case 'denied':
      case 'unavailable':
        return (
          <div className="py-6 flex flex-col items-center gap-3 text-center">
            <AyaMascot pose="wander" size={112} alt="" />
            <h3 className="ios-title text-[19px] text-ink">
              {phase.kind === 'denied' ? 'Location is off for Haraya' : 'Your location is unavailable'}
            </h3>
            <p className="text-[14px] text-ink-2 max-w-xs">
              {phase.kind === 'denied'
                ? 'Check-ins need your location to confirm you are at the spot. Allow it for this site in your browser settings, then try again.'
                : 'Haraya could not get a GPS fix. Step near a window or outdoors and try again.'}
            </p>
            <SecondaryButton onClick={locate} className="inline-flex items-center justify-center gap-2 w-full sm:w-auto">
              <RotateCw className="w-4 h-4" />
              Try again
            </SecondaryButton>
          </div>
        );
      case 'stamped':
        return (
          <div className="py-4 flex flex-col items-center gap-3 text-center">
            <PassportStamp cafeName={cafe.name} city={cafe.city} stampedAt={phase.stampedAt} seed={cafe.id} size={132} />
            <h3 className="ios-title text-[19px] text-ink">Stamp collected</h3>
            <p className="text-[14px] text-ink-2 max-w-xs">
              {phase.synced
                ? `${cafe.name} is in your Davao Passport, with a 30 minute drop-in logged.`
                : `${cafe.name} is in your passport on this device.${signedIn ? '' : ' Sign in to keep your passport across devices.'}`}
            </p>
            <div className="w-full flex flex-col sm:flex-row gap-2 pt-1">
              <PrimaryButton onClick={onOpenPassport} className="w-full sm:flex-1">
                View passport
              </PrimaryButton>
              <SecondaryButton onClick={onClose} className="w-full sm:flex-1">
                Done
              </SecondaryButton>
            </div>
          </div>
        );
      case 'located': {
        const near = phase.distance <= CHECK_IN_RADIUS_M;
        if (!near) {
          return (
            <div className="py-4 flex flex-col items-center gap-3 text-center">
              <AyaMascot pose="wander" size={120} alt="" />
              <h3 className="ios-title text-[19px] text-ink">
                You are <span className="font-mono">{formatKm(phase.distance / 1000)}</span> away
              </h3>
              <p className="text-[14px] text-ink-2 max-w-xs">
                Visit {cafe.name} in person to stamp your passport and log focus time. Check-ins open within{' '}
                <span className="font-mono">{CHECK_IN_RADIUS_M} m</span> of the spot.
              </p>
              <div className="w-full flex flex-col sm:flex-row gap-2 pt-1">
                <PrimaryButton onClick={() => onDirections(cafe)} className="inline-flex items-center justify-center gap-2 w-full sm:flex-1">
                  <Navigation className="w-4 h-4" />
                  Get directions
                </PrimaryButton>
                <SecondaryButton onClick={locate} className="inline-flex items-center justify-center gap-2 w-full sm:flex-1">
                  <RotateCw className="w-4 h-4" />
                  Check again
                </SecondaryButton>
              </div>
            </div>
          );
        }
        return (
          <div className="py-2 flex flex-col items-center gap-3 text-center">
            <AyaMascot pose="arrive" size={124} alt="" />
            <div className="space-y-1">
              <h3 className="ios-title text-[19px] text-ink inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-ok shadow-[0_0_0_4px_rgba(62,92,72,0.18)]" aria-hidden="true" />
                You are at {cafe.name}
              </h3>
              <p className="ios-footnote text-ink-2">
                <span className="font-mono">{Math.round(phase.distance)} m</span> from the spot, verified by GPS
              </p>
            </div>

            {active ? (
              <div className="w-full rounded-row bg-canvas px-4 py-3 text-left space-y-2">
                <p className="text-[14px] text-ink">
                  You are already focusing at <span className="font-semibold">{active.cafeName}</span>. Finish that session first.
                </p>
                <SecondaryButton onClick={onFinishActive} className="w-full">
                  Finish current session
                </SecondaryButton>
              </div>
            ) : (
              <div className="w-full grid gap-2 pt-1">
                <button
                  onClick={startFocus}
                  disabled={busy}
                  className="w-full min-h-14 px-4 py-3 rounded-row bg-tint hover:bg-tint-ink text-surface text-left flex items-center gap-3 ios-press disabled:opacity-60"
                >
                  <FocusTimerIcon className="w-6 h-6 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold">Start Focus Session</span>
                    <span className="block text-[12px] text-surface/80">A timer runs while you study. It saves itself if you leave.</span>
                  </span>
                </button>
                <button
                  onClick={quickStamp}
                  disabled={busy}
                  className="w-full min-h-14 px-4 py-3 rounded-row ios-fill text-left flex items-center gap-3 text-ink ios-press disabled:opacity-60"
                >
                  <RubberStampIcon className="w-6 h-6 shrink-0 text-tint-ink" />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold">{busy ? 'Stamping...' : 'Quick Stamp'}</span>
                    <span className="block text-[12px] text-ink-2">Log a 30 minute drop-in and collect the stamp now.</span>
                  </span>
                </button>
                {!signedIn && (
                  <p className="ios-footnote text-ink-2 pt-1">Signed out, your visits stay on this device.</p>
                )}
              </div>
            )}
          </div>
        );
      }
    }
  })();

  return (
    <Modal isOpen={Boolean(cafe)} onClose={onClose} maxWidth="sm:max-w-md" labelledBy="check-in-title">
      <ModalHeader title="Check in" subtitle={`${cafe.name}, ${cafe.city}`} onClose={onClose} />
      <div className="px-4 sm:px-6 pb-4 pt-2 space-y-3">
        {body}
        {error && <ErrorNote message={error} />}
      </div>
    </Modal>
  );
};
