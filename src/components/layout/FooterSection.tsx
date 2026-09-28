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

const headingClass = 'text-[13px] font-semibold text-[#13191F] mb-2';
const desktopLinkClass =
  'min-h-8 inline-flex items-center text-left text-[14px] text-[#594C3D] hover:text-[#13191F] transition-colors ios-press';

const activeCities = DAVAO_CITIES.filter((city) => city !== 'All Davao Region');

/**
 * Global footer: Responsive layout tailored for both mobile and desktop.
 * On mobile (< lg), streamlines navigation by removing redundant tab links,
 * presents cities as comfortable touch-friendly filter chips, and elevates the
 * "Add a Spot" community callout into a prominent inset card.
 */
export const FooterSection: React.FC<FooterSectionProps> = ({ setActiveTab, setSelectedCity, onAddSpot }) => {
  return (
    <footer className="bg-[#FAF5EB] ios-hairline-t mt-12 pb-24 lg:pb-8" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-10">
        
        {/* Brand Information */}
        <div className="space-y-2">
          <BrandLogo className="h-14 -ml-1" />
          <p className="text-[14px] text-[#594C3D] leading-relaxed max-w-sm">
            Coffee, study spots and hidden gems across the Davao Region.
          </p>
        </div>

        {/* Mobile Community Card (< lg) */}
        <div className="lg:hidden bg-[#FFFDF9] rounded-2xl p-5 border border-[#594C3D]/10 ios-card-shadow space-y-3">
          <div>
            <h3 className="text-[15px] font-semibold text-[#13191F]">Know a hidden spot?</h3>
            <p className="text-[13.5px] text-[#594C3D] leading-relaxed mt-1">
              Share a quiet corner or study cafe not on the map yet. Haraya reviews every spot first.
            </p>
          </div>
          <button
            onClick={onAddSpot}
            className="w-full h-11 px-5 rounded-full bg-[#906D4B] text-[#FFFDF9] text-[15px] font-semibold hover:bg-[#7D5C3D] flex items-center justify-center gap-1.5 ios-press"
          >
            Add a Spot
            <ArrowUpRight className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>

        {/* Mobile City Directory (< lg) */}
        <nav aria-label="Cities directory" className="lg:hidden space-y-3">
          <h3 className="text-[12px] font-semibold text-[#13191F] tracking-wider uppercase font-sans">
            Browse by City
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
            {activeCities.map((city) => (
              <button
                key={city}
                onClick={() => {
                  setSelectedCity(city);
                  setActiveTab('feed');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="min-h-10 text-left text-[14px] text-[#594C3D] hover:text-[#13191F] active:text-[#13191F] transition-colors ios-press flex items-center"
              >
                {city}
              </button>
            ))}
          </div>
        </nav>

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
          <p className="text-[14px] text-[#594C3D] leading-relaxed">
            Share a quiet corner or study cafe that is not on the map yet. Haraya reviews every spot first.
          </p>
          <button
            onClick={onAddSpot}
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-[#906D4B] text-[#FFFDF9] text-[15px] font-semibold hover:bg-[#7D5C3D] ios-press"
          >
            Add a Spot
            <ArrowUpRight className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>

      </div>

      {/* Legal & Copyright Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="ios-hairline-t py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ios-footnote text-[#6E6150]">
          <span>Haraya: Davao Coffee and Study Spot Guide</span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <button onClick={() => setActiveTab('privacy')} className="min-h-9 text-[#7D5C3D] font-medium ios-press">
              Privacy Notice
            </button>
            <span className="text-[#6E6150]/40 select-none">·</span>
            <button onClick={() => setActiveTab('terms')} className="min-h-9 text-[#7D5C3D] font-medium ios-press">
              Terms of Use
            </button>
            <span className="text-[#6E6150]/40 select-none">·</span>
            <span>
              Local Roasts. Your Cup. <span className="font-mono">2026</span>
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
};
