import React from 'react';
import { formatAccuracy } from '../../utils/locationQuality';
import { devicePlatform, locationFix, type LocationProblem } from './locationFix';

interface LocationHelpProps {
  problem: LocationProblem;
  /** Radius of a wide fix in metres, for the approximate and rough problems. */
  accuracyM?: number;
  /** Asks again; left out where the surrounding row already has the button. */
  onRetry?: () => void;
}

/** Why Haraya cannot see the visitor's location (or sees it only roughly), with the steps for their device to fix it. */
export const LocationHelp: React.FC<LocationHelpProps> = ({ problem, accuracyM, onRetry }) => {
  const { title, steps } = locationFix(
    problem,
    devicePlatform(navigator.userAgent, navigator.maxTouchPoints ?? 0),
    accuracyM === undefined ? undefined : formatAccuracy(accuracyM)
  );
  // Only a blocked or missing location is retried by itself when the visitor comes back from the settings
  const autoRetries = problem === 'denied' || problem === 'unavailable';
  return (
    <div className="w-full flex items-start gap-3">
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-[14px] font-semibold text-ink">{title}</p>
        <p className="ios-footnote text-ink-2">
          {steps}
          {autoRetries && ' Haraya picks it up when you come back.'}
        </p>
      </div>
      {onRetry && problem !== 'insecure' && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 h-8 px-3 rounded-full ios-fill text-[14px] font-semibold text-tint-ink ios-press"
        >
          Try again
        </button>
      )}
    </div>
  );
};
