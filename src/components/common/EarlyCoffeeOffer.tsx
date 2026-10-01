import React, { useEffect, useState } from 'react';
import { Coffee } from 'lucide-react';
import { EARLY_COFFEE_SLOTS, EARLY_COFFEE_WINNERS } from '../../config/launch';
import { fetchEarlyRegistrationStatus, type EarlyRegistrationStatus } from '../../services/earlyRegistrationService';

/**
 * The soft-launch coffee offer, shared by the pre-registration page and the landing page while pre-registration is
 * on. A notice, not a badge, so it sits under the action it rewards. The count under it comes from the database,
 * which decides the order; without it the offer shows on its own.
 */

interface EarlyCoffeeOfferProps {
  /** Reads the count again when this changes, so a new sign-up sees its own place in the order. */
  refreshKey?: string | null;
  className?: string;
}

export const EarlyCoffeeOffer: React.FC<EarlyCoffeeOfferProps> = ({ refreshKey = null, className = '' }) => {
  const [status, setStatus] = useState<EarlyRegistrationStatus | null>(null);

  useEffect(() => {
    let current = true;
    void fetchEarlyRegistrationStatus().then((next) => {
      if (current) setStatus(next);
    });
    return () => {
      current = false;
    };
  }, [refreshKey]);

  const statusLine = !status
    ? null
    : status.position !== null && status.position <= status.slots
      ? `You are number ${status.position} of the ${status.slots}.`
      : status.claimed >= status.slots
        ? `All ${status.slots} places are taken.`
        : `${status.slots - status.claimed} of ${status.slots} places left.`;

  return (
    <div className={`mx-auto max-w-xl rounded-sheet bg-ink text-surface px-5 py-5 sm:px-6 flex items-center gap-4 text-left ${className}`}>
      <span className="h-11 w-11 shrink-0 rounded-row bg-surface/12 text-star flex items-center justify-center" aria-hidden="true">
        <Coffee className="w-5 h-5" strokeWidth={2.2} />
      </span>
      <div>
        <p className="text-[15px] sm:text-[16px] leading-[1.5]">
          <span className="font-semibold">
            {EARLY_COFFEE_WINNERS} of the first {EARLY_COFFEE_SLOTS} registered accounts
          </span>{' '}
          will have the opportunity to get a coffee at a selected coffee shop, to be announced.
        </p>
        {statusLine && (
          <p className="mt-1 text-[14px] font-semibold text-star" role="status">
            {statusLine}
          </p>
        )}
      </div>
    </div>
  );
};
