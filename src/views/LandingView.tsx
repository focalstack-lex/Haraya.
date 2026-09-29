import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Clock3, Footprints, MapPin, Smile, Stamp } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { AyaMascot } from '../components/common/AyaMascot';
import { DAVAO_CITIES } from '../types/coffee';

/**
 * Landing page shown at the bare URL (see `isLandingEntry` in utils/router.ts). It showcases the app with real
 * screenshots captured from the running app (public/landing/, 375x812 at 2x) and states only what the app does:
 * no store badges (there is no native app), no counts, no testimonials. Every call to action enters the app.
 */

interface LandingViewProps {
  /** Enters the app on a tab, optionally scoped to a city. */
  onEnter: (tab: string, city?: string) => void;
}

const SCREEN = { width: 750, height: 1624 };

/**
 * Line-art iPhone traced from the brand mockup (Haraya Files/Haraya Coffee Spots/Green Coffee Digos/iphone mockup.png,
 * a 147x293 outline): 5-unit stroke, 19-unit corners, a 41x11 Dynamic Island 13 units from the top. The source is
 * too small to scale up as a bitmap, so it is redrawn as SVG in the same units and stays sharp at any size.
 */
const Phone: React.FC<{ src: string; alt: string; className?: string; eager?: boolean }> = ({ src, alt, className = '', eager = false }) => (
  <div className={`relative aspect-[147/293] drop-shadow-[0_24px_28px_rgba(19,25,31,0.22)] ${className}`}>
    {/* Screen: inset to the stroke's inner edge, with the matching inner corner radius */}
    <div className="absolute inset-[1.7%_3.4%] overflow-hidden rounded-[10%/5%] bg-canvas">
      <img
        src={src}
        alt={alt}
        width={SCREEN.width}
        height={SCREEN.height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className="w-full h-full object-cover object-top"
      />
    </div>
    <svg viewBox="0 0 147 293" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <rect x="2.5" y="2.5" width="142" height="288" rx="19" fill="none" stroke="#13191F" strokeWidth="5" />
      <rect x="53" y="13" width="41" height="11" rx="5.5" fill="#13191F" />
    </svg>
  </div>
);

const primaryButton =
  'inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-tint text-surface text-[16px] font-semibold hover:bg-tint-ink ios-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tint focus-visible:ring-offset-2 focus-visible:ring-offset-canvas transition-colors';
const secondaryButton =
  'inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full ios-fill text-ink text-[16px] font-semibold hover:bg-shade/20 ios-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tint focus-visible:ring-offset-2 focus-visible:ring-offset-canvas transition-colors';

const BAND_ITEMS = ['Study and work', 'Quiet corners', 'Open late', 'Plugs and Wi-Fi', 'Hidden gems', 'Walking routes', 'Focus sessions'];

const BENEFITS = {
  left: [
    {
      icon: Clock3,
      title: 'Open now, honestly',
      body: 'Every spot shows whether it is open right now and how long it stays open, even the ones that close after midnight.',
    },
    {
      icon: Smile,
      title: 'Tell Aya how you feel',
      body: 'Focused, cozy, social or treating yourself: Aya picks three spots and says why each one fits, how far it is and what to order.',
    },
  ],
  right: [
    {
      icon: Footprints,
      title: 'Walk there in the app',
      body: 'A walking route that follows the streets, with the time left as you go. Google Maps and Apple Maps are one tap away too.',
    },
    {
      icon: Stamp,
      title: 'A passport for your cafe days',
      body: 'Check in when you arrive, log a focus session, and collect a stamp for every sanctuary you visit.',
    },
  ],
};

const STEPS = [
  { title: 'Say what you need', body: 'Pick a mood, or filter for study spots, quiet tables and places open late.' },
  { title: 'Walk there', body: 'Follow the route on the map, or hand it to the maps app you already use.' },
  { title: 'Check in and stamp', body: 'Start a focus session or take a quick stamp. Every visit lands in your diary.' },
];

const CITIES = DAVAO_CITIES.filter((city) => city !== 'All Davao Region');

const Benefit: React.FC<{ icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; title: string; body: string; align: 'left' | 'right' }> = ({
  icon: Icon,
  title,
  body,
  align,
}) => (
  <div className={`flex flex-col gap-3 ${align === 'right' ? 'lg:items-end lg:text-right' : ''}`}>
    <span className="h-11 w-11 rounded-row bg-tint/12 text-tint-ink flex items-center justify-center" aria-hidden="true">
      <Icon className="w-5 h-5" strokeWidth={2} />
    </span>
    <h3 className="text-[18px] font-semibold text-ink leading-snug">{title}</h3>
    <p className="text-[15px] leading-[1.55] text-ink-2 max-w-[38ch]">{body}</p>
  </div>
);

export const LandingView: React.FC<LandingViewProps> = ({ onEnter }) => {
  const reduceMotion = useReducedMotion();

  // In-page links scroll instead of setting a hash, because the hash is the app's router
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  // The page's one authored moment: the three phones rise into place, the center one first
  const rise = (delay: number) =>
    reduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }
      : { initial: { opacity: 0, y: 48 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] as const } };

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans">
      <header className="sticky top-0 z-40 ios-material-bar ios-hairline-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <BrandLogo className="h-10" eager />
          <nav aria-label="Page sections" className="hidden md:flex items-center gap-1">
            {[
              ['features', 'Features'],
              ['how-it-works', 'How it works'],
              ['cities', 'Cities'],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="h-10 px-4 rounded-full text-[15px] font-medium text-ink-2 hover:text-ink hover:bg-shade/10 transition-colors"
              >
                {label}
              </button>
            ))}
          </nav>
          <button onClick={() => onEnter('feed')} className={`${primaryButton} !h-11 !px-5 !text-[15px]`}>
            Open Haraya
          </button>
        </div>
      </header>

      <main>
        {/* Hero: the promise, two actions, and the app itself on a roast arch */}
        <section className="relative overflow-hidden pt-12 sm:pt-16 lg:pt-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h1 className="font-cooper text-[40px] sm:text-[56px] lg:text-[64px] font-bold leading-[1.02] tracking-[-0.035em] text-balance">
              Find your daily cup in Davao.
            </h1>
            <p className="mt-5 mx-auto max-w-[40ch] text-[17px] sm:text-[19px] leading-[1.5] text-ink-2 text-balance">
              Cafes, study spots and hidden gems across the Davao Region, with which ones are open right now.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <button onClick={() => onEnter('feed')} className={`${primaryButton} w-full sm:w-auto`}>
                Open Haraya
                <ArrowRight className="w-4.5 h-4.5" strokeWidth={2.4} />
              </button>
              <button onClick={() => onEnter('map')} className={`${secondaryButton} w-full sm:w-auto`}>
                <MapPin className="w-4.5 h-4.5 text-tint-ink" strokeWidth={2.2} />
                See the map
              </button>
            </div>
            <p className="mt-4 text-[14px] text-ink-3">Free, and nothing to install. It runs in your phone's browser.</p>
          </div>

          <div className="relative mt-12 sm:mt-16 max-w-5xl mx-auto px-4">
            <div
              aria-hidden="true"
              className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[min(118vw,820px)] aspect-[2/1] rounded-t-full bg-tint"
            />
            {/* Below sm the phones scale with the screen (29vw, 44vw, 29vw minus the overlaps) so all three fit at 320px */}
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
            {/* Aya stands just outside the arch's left foot, clear of the phones; there is no room for her below lg */}
            <AyaMascot pose="welcome" size={112} alt="" className="absolute z-20 bottom-0 left-[calc(50%-530px)] hidden lg:block" />
          </div>

          {/* Everything the app filters for, on a slow loop (a still, scrollable row under reduced motion) */}
          <div className="relative z-30 bg-ink text-surface overflow-hidden landing-band">
            <div className="landing-marquee flex w-max">
              {[0, 1].map((copy) => (
                <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1 ? true : undefined}>
                  {BAND_ITEMS.map((item) => (
                    <li key={item} className="flex items-center gap-6 pl-6 h-14 text-[16px] font-medium whitespace-nowrap">
                      <span className="h-1.5 w-1.5 rounded-full bg-star" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits around the mood finder */}
        <section id="features" className="scroll-mt-20 py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-cooper text-[30px] sm:text-[40px] font-bold leading-[1.1] tracking-[-0.03em] text-balance">
                Made for how you actually pick a cafe
              </h2>
              <p className="mt-4 text-[17px] leading-[1.55] text-ink-2 text-balance">
                Not the closest one on a map. The one with a free plug, a quiet table and a door that is still open.
              </p>
            </div>

            <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-14">
              <div className="order-2 lg:order-1 grid gap-10 sm:grid-cols-2 lg:grid-cols-1 lg:gap-14">
                {BENEFITS.left.map((benefit) => (
                  <Benefit key={benefit.title} {...benefit} align="right" />
                ))}
              </div>
              <div className="order-1 lg:order-2 relative flex justify-center">
                <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] rounded-full bg-tint/12" />
                <Phone src="/landing/mood.jpg" alt="The mood finder: moods, must-haves, weather and Aya's picks" className="relative w-[230px] sm:w-[260px]" />
              </div>
              <div className="order-3 grid gap-10 sm:grid-cols-2 lg:grid-cols-1 lg:gap-14">
                {BENEFITS.right.map((benefit) => (
                  <Benefit key={benefit.title} {...benefit} align="left" />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works: a real sequence, so the steps carry numbers */}
        <section id="how-it-works" className="scroll-mt-20 bg-sunken py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-14 lg:grid-cols-2 lg:items-center">
            <div className="relative flex justify-center lg:order-2">
              <Phone src="/landing/passport.jpg" alt="Your Passport: focus hours, sanctuaries visited, and your diary" className="w-[230px] sm:w-[260px]" />
              <AyaMascot pose="stamp" size={120} alt="" className="absolute -bottom-6 left-[max(0px,calc(50%-190px))] sm:left-[calc(50%-210px)]" />
            </div>
            <div className="lg:order-1">
              <h2 className="font-cooper text-[30px] sm:text-[40px] font-bold leading-[1.1] tracking-[-0.03em] text-balance">
                From craving to cup in three steps
              </h2>
              <p className="mt-4 max-w-[46ch] text-[17px] leading-[1.55] text-ink-2">
                Haraya works like a friend who knows every corner of Davao and keeps track of where you have been.
              </p>
              <ol className="mt-10 space-y-8">
                {STEPS.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="shrink-0 h-10 w-10 rounded-full bg-tint text-surface font-mono text-[16px] font-semibold flex items-center justify-center" aria-hidden="true">
                      {index + 1}
                    </span>
                    <div className="pt-1.5">
                      <h3 className="text-[18px] font-semibold leading-snug">{step.title}</h3>
                      <p className="mt-1.5 text-[15px] leading-[1.55] text-ink-2 max-w-[44ch]">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <button onClick={() => onEnter('feed')} className={`${primaryButton} mt-10 w-full sm:w-auto`}>
                Start with a mood
                <ArrowRight className="w-4.5 h-4.5" strokeWidth={2.4} />
              </button>
            </div>
          </div>
        </section>

        {/* Cities: each one opens Discover already scoped to it */}
        <section id="cities" className="scroll-mt-20 py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-cooper text-[30px] sm:text-[40px] font-bold leading-[1.1] tracking-[-0.03em]">Across the Davao Region</h2>
            <p className="mt-4 max-w-[52ch] text-[17px] leading-[1.55] text-ink-2">
              Pick a city and Discover opens there. Locals add the quiet corners, and Haraya reviews every spot before it goes up.
            </p>
            <ul className="mt-10 grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 gap-3">
              {CITIES.map((city) => (
                <li key={city}>
                  <button
                    onClick={() => onEnter('feed', city)}
                    className="group w-full min-h-14 px-4 rounded-row bg-surface ios-card-shadow flex items-center gap-3 text-left ios-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tint"
                  >
                    <MapPin className="w-4.5 h-4.5 shrink-0 text-tint-ink" strokeWidth={2.2} />
                    <span className="flex-1 min-w-0 text-[16px] font-medium">{city}</span>
                    <ArrowRight className="w-4 h-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="pb-20 sm:pb-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-sheet bg-ink text-surface px-6 py-10 sm:px-12 sm:py-14 flex flex-col md:flex-row md:items-center gap-8">
              <div className="flex-1">
                <h2 className="font-cooper text-[30px] sm:text-[40px] font-bold leading-[1.1] tracking-[-0.03em] text-balance">
                  Your next cup is close.
                </h2>
                <p className="mt-4 max-w-[44ch] text-[17px] leading-[1.55] text-surface/80">
                  Open Haraya, tell Aya how you feel, and go. Know a spot that is missing? Add it for everyone.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => onEnter('feed')}
                    className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-surface text-ink text-[16px] font-semibold hover:bg-sunken ios-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-star transition-colors"
                  >
                    Open Haraya
                    <ArrowRight className="w-4.5 h-4.5" strokeWidth={2.4} />
                  </button>
                  <button
                    onClick={() => onEnter('submit')}
                    className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-surface/12 text-surface text-[16px] font-semibold hover:bg-surface/20 ios-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-star transition-colors"
                  >
                    Add a hidden spot
                  </button>
                </div>
              </div>
              <AyaMascot pose="clink" size={180} alt="" className="self-center md:self-end shrink-0" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
