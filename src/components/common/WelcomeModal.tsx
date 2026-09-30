import React, { useEffect, useState } from 'react';
import { BookOpen, MapPin, Sparkles, X } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { BrandLogo } from './BrandLogo';
import { AyaMascot } from './AyaMascot';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetStarted: () => void;
  onLogIn: () => void;
}

const SHEET_SPRING = { type: 'spring', stiffness: 380, damping: 36, mass: 0.9 } as const;
const PHONE_QUERY = '(max-width: 639px)';

/** What the app does, stated plainly: one row per real surface. */
const FEATURES = [
  {
    icon: MapPin,
    title: 'Great coffee',
    body: 'Cafes near you, and which are open now.',
  },
  {
    icon: BookOpen,
    title: 'Study spots',
    body: 'Plugs, Wi-Fi and quiet tables.',
  },
  {
    icon: Sparkles,
    title: 'Hidden gems',
    body: 'Quiet corners locals add, reviewed first.',
  },
];

const usePhoneLayout = () => {
  const [isPhone, setIsPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(PHONE_QUERY).matches);
  useEffect(() => {
    const media = window.matchMedia(PHONE_QUERY);
    const update = () => setIsPhone(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return isPhone;
};

/** First-run onboarding: a bottom sheet on phones, a centered card on desktop. */
export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onGetStarted,
  onLogIn,
}) => {
  const isPhone = usePhoneLayout();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sheetMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : isPhone
      ? { initial: { y: '100%' }, animate: { y: 0 } }
      : { initial: { opacity: 0, scale: 0.96, y: 12 }, animate: { opacity: 1, scale: 1, y: 0 } };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-ink/40 p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        {...sheetMotion}
        transition={SHEET_SPRING}
        className="relative w-full sm:max-w-md bg-surface text-ink rounded-t-sheet sm:rounded-sheet max-h-[92dvh] overflow-y-auto overscroll-contain shadow-sheet sm:shadow-[0_24px_64px_-12px_rgba(19,25,31,0.35)] sheet-safe"
      >
        {/* Grabber: visual sheet cue on phones */}
        <div className="sm:hidden flex justify-center pt-1.5" aria-hidden="true">
          <span className="ios-grabber" />
        </div>

        {/* Skip */}
        <button
          onClick={onClose}
          aria-label="Close and explore as a guest"
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 h-11 w-11 flex items-center justify-center ios-press"
        >
          <span className="h-7.5 w-7.5 rounded-full bg-shade/15 flex items-center justify-center text-ink-2">
            <X className="w-4 h-4" strokeWidth={2.5} />
          </span>
        </button>

        <div className="px-4 sm:px-6 pt-5 sm:pt-7 pb-2 space-y-6">
          {/* Brand mark and headline */}
          <div className="space-y-3 pr-10">
            <div className="flex items-end justify-between gap-3">
              <BrandLogo className="h-24 sm:h-28 -ml-2" eager />
              <AyaMascot pose="welcome" size={88} alt="Aya, the Haraya mascot, waving hello" className="-mb-1" />
            </div>
            <h1 id="welcome-title" className="ios-large-title">
              Coffee and study spots in Davao
            </h1>
          </div>

          {/* What the app does */}
          <ul className="space-y-4">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3.5">
                <span className="h-10 w-10 shrink-0 rounded-row bg-tint/12 flex items-center justify-center text-tint">
                  <feature.icon className="w-5 h-5" />
                </span>
                <span className="min-w-0">
                  <span className="block ios-headline text-ink">{feature.title}</span>
                  <span className="block text-[14px] font-sans text-ink-2 leading-snug mt-0.5">{feature.body}</span>
                </span>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="space-y-1 pt-1">
            <button
              onClick={onGetStarted}
              className="w-full h-12 rounded-full bg-tint hover:bg-tint-ink text-surface font-sans font-semibold text-[16px] ios-press"
            >
              Get started
            </button>
            <div className="flex items-center justify-center gap-1 text-[14px] font-sans text-ink-2">
              <span>Already have an account?</span>
              <button
                onClick={onLogIn}
                className="min-h-11 px-1 font-semibold text-tint-ink ios-press"
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
