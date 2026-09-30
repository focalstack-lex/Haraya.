import React from 'react';
import { devicePlatform, locationFix, type LocationProblem } from './locationFix';

interface LocationHelpProps {
  problem: LocationProblem;
  /** Asks again; left out where the surrounding row already has the button. */
  onRetry?: () => void;
}

/** Why Haraya cannot see the visitor's location, with the steps for their device to turn it on. */
export const LocationHelp: React.FC<LocationHelpProps> = ({ problem, onRetry }) => {
  const { title, steps } = locationFix(problem, devicePlatform(navigator.userAgent, navigator.maxTouchPoints ?? 0));
  return (
    <div className="w-full flex items-start gap-3">
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-[14px] font-semibold text-[#13191F]">{title}</p>
        <p className="ios-footnote text-[#594C3D]">
          {steps}
          {problem !== 'insecure' && ' Haraya picks it up when you come back.'}
        </p>
      </div>
      {onRetry && problem !== 'insecure' && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 h-8 px-3 rounded-full ios-fill text-[14px] font-semibold text-[#7D5C3D] ios-press"
        >
          Try again
        </button>
      )}
    </div>
  );
};
