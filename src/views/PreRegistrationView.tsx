import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CircleCheck, LogOut } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { AyaMascot } from '../components/common/AyaMascot';
import { Phone } from './LandingView';
import { EarlyCoffeeOffer } from '../components/common/EarlyCoffeeOffer';

/**
 * The soft-launch page: while PRE_REGISTRATION is on it replaces the landing page and every tab for everyone but
 * admins. Reading order: Haraya is not open yet, register now, the coffee offer for the first accounts, then a look
 * at the app. A signed-in visitor sees that they are registered instead of the register button. Only the create-
 * account page and the legal pages open from here; sign-in is not offered until launch. The count under the offer comes from the database, which decides the
 * order; without it the offer shows on its own.
 */

interface PreRegistrationViewProps {
  /** Email of the signed-in account, or null when signed out. */
  registeredEmail: string | null;
  onRegister: () => void;
  onSignOut: () => void;
  onOpenLegal: (page: 'privacy' | 'terms') => void;
}

const primaryButton =
  'inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-tint text-surface text-[16px] font-semibold hover:bg-tint-ink ios-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tint focus-visible:ring-offset-2 focus-visible:ring-offset-canvas transition-colors';

export const PreRegistrationView: React.FC<PreRegistrationViewProps> = ({ registeredEmail, onRegister, onSignOut, onOpenLegal }) => {
  const reduceMotion = useReducedMotion();
  const rise = (delay: number) =>
    reduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }
      : { initial: { opacity: 0, y: 48 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] as const } };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink font-sans">
      <header className="sticky top-0 z-40 ios-material-bar ios-hairline-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <BrandLogo className="h-10" eager />
          {registeredEmail && (
            <button
              onClick={onSignOut}
              className="h-11 px-4 rounded-full inline-flex items-center gap-2 text-[15px] font-medium text-ink-2 hover:text-ink hover:bg-shade/10 transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={2.2} />
              Sign out
            </button>
          )}
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden pt-12 sm:pt-16 lg:pt-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h1 className="font-cooper text-[40px] sm:text-[56px] lg:text-[64px] font-bold leading-[1.02] tracking-[-0.035em] text-balance">
              Haraya opens soon.
            </h1>
            <p className="mt-5 mx-auto max-w-[44ch] text-[17px] sm:text-[19px] leading-[1.5] text-ink-2 text-balance">
              Cafes, study spots and hidden gems across the Davao Region. Pre-register now and your account is ready the day
              Haraya opens.
            </p>

            {registeredEmail ? (
              <div className="mt-8 mx-auto max-w-md rounded-card bg-surface ios-card-shadow px-5 py-4 flex items-start gap-3 text-left" role="status">
                <CircleCheck className="w-6 h-6 shrink-0 mt-0.5 text-tint-ink" strokeWidth={2.2} aria-hidden="true" />
                <div>
                  <p className="text-[16px] font-semibold">You are pre-registered</p>
                  <p className="mt-1 text-[15px] leading-[1.45] text-ink-2">
                    Signed in as <span className="font-semibold text-ink [overflow-wrap:anywhere]">{registeredEmail}</span>. The app
                    opens to this account at launch.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                <button onClick={onRegister} className={`${primaryButton} w-full sm:w-auto`}>
                  Pre-register
                  <ArrowRight className="w-4.5 h-4.5" strokeWidth={2.4} />
                </button>
              </div>
            )}

            {/* The early offer: a notice, not a badge, so it sits under the action it rewards */}
            <EarlyCoffeeOffer refreshKey={registeredEmail} className="mt-8" />
          </div>

          <div className="relative mt-12 sm:mt-16 max-w-5xl mx-auto px-4">
            <div
              aria-hidden="true"
              className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[min(118vw,820px)] aspect-[2/1] rounded-t-full bg-tint"
            />
            <div className="relative flex items-end justify-center">
              <motion.div {...rise(0.25)} className="relative z-0 -mr-[6vw] sm:-mr-8 mb-4 sm:mb-10 -rotate-6 origin-bottom-right">
                <Phone src="/landing/map.jpg" alt="Map and Spots: every spot pinned across the Davao Region" className="w-[29vw] sm:w-[200px] lg:w-[230px]" eager />
              </motion.div>
              <motion.div {...rise(0.1)} className="relative z-10">
                <Phone src="/landing/discover.jpg" alt="Discover: the mood card with Aya, spot categories and the spot list" className="w-[44vw] sm:w-[250px] lg:w-[280px]" eager />
              </motion.div>
              <motion.div {...rise(0.4)} className="relative z-0 -ml-[6vw] sm:-ml-8 mb-4 sm:mb-10 rotate-6 origin-bottom-left">
                <Phone src="/landing/spot.jpg" alt="A spot sheet: photo, open now, directions, check in and hours" className="w-[29vw] sm:w-[200px] lg:w-[230px]" eager />
              </motion.div>
            </div>
            <AyaMascot pose="welcome" size={112} alt="" className="absolute z-20 bottom-0 left-[calc(50%-530px)] hidden lg:block" />
          </div>
        </section>
      </main>

      <PreRegistrationFooter onOpenLegal={onOpenLegal} />
    </div>
  );
};

/** The pre-registration footer: the legal pages the create-account form agrees to, and nothing that opens the app. */
export const PreRegistrationFooter: React.FC<{ onOpenLegal: (page: 'privacy' | 'terms') => void }> = ({ onOpenLegal }) => (
  <footer className="bg-ink text-surface/80">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[14px]">
      <p>Haraya, for the Davao Region.</p>
      <div className="flex items-center gap-4">
        <button onClick={() => onOpenLegal('privacy')} className="min-h-11 font-medium text-surface hover:underline underline-offset-2">
          Privacy Notice
        </button>
        <button onClick={() => onOpenLegal('terms')} className="min-h-11 font-medium text-surface hover:underline underline-offset-2">
          Terms
        </button>
      </div>
    </div>
  </footer>
);
