import React from 'react';
import { ArrowUpRight, ArrowLeftRight, MapPin } from 'lucide-react';
import { NAV_TABS, PORTAL_TAB_ID } from './NavigationHeader';
import { DAVAO_CITIES } from '../../types/coffee';
import { SISTER_PLATFORM } from '../../config/ecosystem';

interface FooterSectionProps {
  setActiveTab: (tab: string) => void;
  setSelectedCity: (city: string) => void;
  onJoinRoaster: () => void;
}

/** Global footer: obsidian slab with the ecosystem bridge and city directory. */
export const FooterSection: React.FC<FooterSectionProps> = ({ setActiveTab, setSelectedCity, onJoinRoaster }) => {
  return (
    <footer className="bg-[#1A2225] text-[#FFF9E9] mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="font-cooper text-2xl font-bold">Haraya</div>
          <p className="text-xs font-sans text-[#FFF9E9]/70 leading-relaxed max-w-xs">
            Local Roasts. Your Cup. Micro-roasteries, fresh single-origin bean drops, and specialty cafe
            discovery across the Davao Region.
          </p>
          <a
            href={SISTER_PLATFORM.url}
            className="inline-flex items-center gap-2 h-9 pl-3 pr-4 rounded-full border border-[#FFF9E9]/25 text-xs font-bold font-sans hover:bg-[#FFF9E9]/10 transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Sister platform: Habi, Davao Local Fashion
          </a>
        </div>

        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#FFF9E9]/60 font-sans mb-3">Explore</h3>
          <ul className="space-y-2">
            {NAV_TABS.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className="text-sm font-sans text-[#FFF9E9]/85 hover:text-[#FFF9E9] transition-colors"
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#FFF9E9]/60 font-sans mb-3">Cities</h3>
          <ul className="space-y-2">
            {DAVAO_CITIES.filter((city) => city !== 'All Davao Region').map((city) => (
              <li key={city}>
                <button
                  onClick={() => {
                    setSelectedCity(city);
                    setActiveTab('feed');
                  }}
                  className="text-sm font-sans text-[#FFF9E9]/85 hover:text-[#FFF9E9] transition-colors inline-flex items-center gap-1.5"
                >
                  <MapPin className="w-3 h-3 opacity-60" />
                  {city}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#FFF9E9]/60 font-sans">Roasters and Cafe Owners</h3>
          <p className="text-xs font-sans text-[#FFF9E9]/70 leading-relaxed">
            List your roastery, schedule bean drops, and manage your menu from the Roaster Suite.
          </p>
          <button
            onClick={onJoinRoaster}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#FFF9E9] text-[#1A2225] text-xs font-bold font-sans hover:bg-white transition-colors"
          >
            Join as a Roaster
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveTab(PORTAL_TAB_ID)}
            className="block text-xs font-sans text-[#FFF9E9]/70 hover:text-[#FFF9E9] underline underline-offset-4 transition-colors"
          >
            Roaster sign in
          </button>
        </div>
      </div>

      <div className="border-t border-[#FFF9E9]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-sans text-[#FFF9E9]/55 tracking-wide">
          <span>Haraya: Davao Specialty Coffee and Bean Archive</span>
          <span>Local Roasts. Your Cup.</span>
          <span>2026</span>
        </div>
      </div>
    </footer>
  );
};
