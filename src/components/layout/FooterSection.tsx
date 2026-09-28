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

const headingClass = 'text-[13px] font-semibold text-[#13191F] mb-1 lg:mb-2';
const linkClass =
  'min-h-11 lg:min-h-0 lg:py-1 inline-flex items-center text-left text-[14px] text-[#594C3D] hover:text-[#13191F] transition-colors ios-press';

/** Global footer: light canvas with a hairline top, the city directory and roaster links. */
export const FooterSection: React.FC<FooterSectionProps> = ({ setActiveTab, setSelectedCity, onAddSpot }) => {
  return (
    <footer className="bg-[#FAF5EB] ios-hairline-t mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 lg:gap-10">
        <div className="col-span-2 lg:col-span-1 space-y-2">
          <BrandLogo className="h-14 -ml-1" />
          <p className="text-[14px] text-[#594C3D] leading-relaxed max-w-xs">
            Coffee, study spots and hidden gems across the Davao Region.
          </p>
        </div>

        <nav aria-label="Explore">
          <h3 className={headingClass}>Explore</h3>
          <ul>
            {NAV_TABS.map((tab) => (
              <li key={tab.id}>
                <button onClick={() => setActiveTab(tab.id)} className={linkClass}>
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Cities">
          <h3 className={headingClass}>Cities</h3>
          <ul>
            {DAVAO_CITIES.filter((city) => city !== 'All Davao Region').map((city) => (
              <li key={city}>
                <button
                  onClick={() => {
                    setSelectedCity(city);
                    setActiveTab('feed');
                  }}
                  className={linkClass}
                >
                  {city}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="col-span-2 lg:col-span-1 space-y-3">
          <h3 className={headingClass}>Know a hidden spot?</h3>
          <p className="text-[14px] text-[#594C3D] leading-relaxed max-w-sm">
            Share a quiet corner or study cafe that is not on the map yet. Haraya reviews every spot first.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <button
              onClick={onAddSpot}
              className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-[#906D4B] text-[#FFFDF9] text-[15px] font-semibold hover:bg-[#7D5C3D] ios-press"
            >
              Add a Spot
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="ios-hairline-t py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 ios-footnote text-[#6E6150]">
          <span>Haraya: Davao Coffee and Study Spot Guide</span>
          <span className="flex flex-wrap items-center gap-x-4">
            <button onClick={() => setActiveTab('privacy')} className="min-h-11 text-[#7D5C3D] font-medium ios-press">
              Privacy Notice
            </button>
            <button onClick={() => setActiveTab('terms')} className="min-h-11 text-[#7D5C3D] font-medium ios-press">
              Terms of Use
            </button>
            <span>
              Local Roasts. Your Cup. <span className="font-mono">2026</span>
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
};
