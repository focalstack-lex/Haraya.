import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { NAV_TABS } from './NavigationHeader';
import { BrandLogo } from '../common/BrandLogo';
import { DAVAO_CITIES } from '../../types/coffee';

interface FooterSectionProps {
  setActiveTab: (tab: string) => void;
  setSelectedCity: (city: string) => void;
  onAddSpot: () => void;
}

const headingClass = 'text-[13px] font-semibold text-ink mb-2';
const desktopLinkClass =
  'min-h-8 inline-flex items-center text-left text-[14px] text-ink-2 hover:text-ink transition-colors ios-press';

const activeCities = DAVAO_CITIES.filter((city) => city !== 'All Davao Region');

/**
 * Footer for the landing page and the desktop app shell. Phones see the brand line and the legal row
 * (landing only); the link columns appear from lg up. Inside the app on phones there is no footer.
 */
export const FooterSection: React.FC<FooterSectionProps> = ({ setActiveTab, setSelectedCity, onAddSpot }) => {
  return (
    <footer className="bg-canvas ios-hairline-t mt-12 pb-8" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-10">
        
        {/* Brand Information */}
        <div className="space-y-2">
          <BrandLogo className="h-14 -ml-1" />
          <p className="text-[14px] text-ink-2 leading-relaxed max-w-sm">
            Coffee, study spots and hidden gems across the Davao Region.
          </p>
        </div>

        {/* Desktop Navigation Links (>= lg only) */}
        <nav aria-label="Explore pages" className="hidden lg:block">
          <h3 className={headingClass}>Explore</h3>
          <ul className="space-y-1">
            {NAV_TABS.map((tab) => (
              <li key={tab.id}>
                <button onClick={() => setActiveTab(tab.id)} className={desktopLinkClass}>
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop Cities Column (>= lg only) */}
        <nav aria-label="Cities directory" className="hidden lg:block">
          <h3 className={headingClass}>Cities</h3>
          <ul className="space-y-1">
            {activeCities.map((city) => (
              <li key={city}>
                <button
                  onClick={() => {
                    setSelectedCity(city);
                    setActiveTab('feed');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={desktopLinkClass}
                >
                  {city}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop Community Column (>= lg only) */}
        <div className="hidden lg:block space-y-3">
          <h3 className={headingClass}>Know a hidden spot?</h3>
          <p className="text-[14px] text-ink-2 leading-relaxed">
            Share a quiet corner or study cafe that is not on the map yet. Haraya reviews every spot first.
          </p>
          <button
            onClick={onAddSpot}
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-tint text-surface text-[15px] font-semibold hover:bg-tint-ink ios-press"
          >
            Add a Spot
            <ArrowUpRight className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>

      </div>

      {/* Legal & Copyright Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="ios-hairline-t py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ios-footnote text-ink-3">
          <span>Haraya: Davao Coffee and Study Spot Guide</span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <button onClick={() => setActiveTab('privacy')} className="min-h-9 text-tint-ink font-medium ios-press">
              Privacy Notice
            </button>
            <span className="text-ink-3/40 select-none">·</span>
            <button onClick={() => setActiveTab('terms')} className="min-h-9 text-tint-ink font-medium ios-press">
              Terms of Use
            </button>
            {/* On phones the tagline takes its own line, so this dot would dangle at the end of the row */}
            <span className="hidden sm:inline text-ink-3/40 select-none">·</span>
            <span className="w-full sm:w-auto">
              Local Roasts. Your Cup. <span className="font-mono">2026</span>
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
};
