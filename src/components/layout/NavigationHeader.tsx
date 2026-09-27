import React from 'react';
import { Menu, Search, ArrowLeftRight, ShieldCheck, UserRound } from 'lucide-react';
import { FeedIcon, DropsIcon, MapIcon, CupCheckIcon, SavedIcon, RoasterIcon } from '../common/CustomIcons';
import { DAVAO_CITIES } from '../../types/coffee';
import type { PortalRole } from '../../types/auth';
import { SISTER_PLATFORM } from '../../config/ecosystem';

/** The portal tab is shared by the sign-in view, roaster dashboard, and admin panel. */
export const PORTAL_TAB_ID = 'roaster';

export const NAV_TABS: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'feed', label: 'Discover', icon: FeedIcon },
  { id: 'drops', label: 'Bean Drops', icon: DropsIcon },
  { id: 'map', label: 'Coffee Map', icon: MapIcon },
  { id: 'community', label: 'Cup Check', icon: CupCheckIcon },
  { id: 'saved', label: 'Saved', icon: SavedIcon },
];

export const PortalIcon: React.FC<{ role: PortalRole; className?: string }> = ({ role, className = 'w-4 h-4' }) => {
  if (role === 'admin') return <ShieldCheck className={className} />;
  if (role === 'roaster') return <RoasterIcon className={className} />;
  return <UserRound className={className} />;
};

export const PORTAL_LABELS: Record<PortalRole, { short: string; long: string }> = {
  guest: { short: 'Roaster Sign In', long: 'Roaster Sign In' },
  roaster: { short: 'Roaster Suite', long: 'My Roaster Suite' },
  admin: { short: 'Control Room', long: 'Admin Control Room' },
};

interface NavigationHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  savedCount: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  portalRole: PortalRole;
}

interface TabButtonProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onSelect: (id: string) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ id, label, icon, active, onSelect }) => (
  <button
    onClick={() => onSelect(id)}
    aria-current={active ? 'page' : undefined}
    className={`h-9 px-3.5 rounded-full flex items-center gap-1.5 text-xs font-bold font-sans transition-colors ${
      active ? 'bg-[#1A2225] text-[#FFF9E9]' : 'text-[#1A2225] hover:bg-[#F3ECD8]'
    }`}
  >
    {icon}
    {label}
  </button>
);

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedCity,
  setSelectedCity,
  searchQuery,
  setSearchQuery,
  savedCount,
  isDrawerOpen,
  setIsDrawerOpen,
  portalRole,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#FBF4E4]/90 backdrop-blur-md border-b border-[#E6DCC0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3 h-14 sm:h-16">
          {/* Brand */}
          <button
            onClick={() => setActiveTab('feed')}
            className="flex items-center gap-2 shrink-0"
            aria-label="Haraya home"
          >
            <span className="h-8 w-8 rounded-full bg-[#1A2225] flex items-center justify-center">
              <FlameMark />
            </span>
            <span className="font-cooper text-xl sm:text-2xl font-bold text-[#1A2225] tracking-tight">Haraya</span>
          </button>

          {/* Sister ecosystem switcher: Haraya (coffee) and Habi (fashion) share one design DNA */}
          <a
            href={SISTER_PLATFORM.url}
            title={`Switch to Habi: ${SISTER_PLATFORM.tagline}`}
            className="h-9 hidden sm:flex items-center gap-1.5 pl-2.5 pr-3 rounded-full bg-[#F3ECD8] border border-[#E6DCC0] hover:border-[#1A2225]/40 transition-colors shrink-0"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#55615D]" />
            <span className="text-[10px] font-bold font-sans tracking-widest text-[#55615D]">HABI</span>
          </a>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-1 ml-1" aria-label="Primary">
            {NAV_TABS.map((tab) => (
              <TabButton
                key={tab.id}
                id={tab.id}
                label={tab.label}
                icon={<tab.icon className="w-4 h-4" />}
                active={activeTab === tab.id}
                onSelect={setActiveTab}
              />
            ))}
            <TabButton
              id={PORTAL_TAB_ID}
              label={PORTAL_LABELS[portalRole].short}
              icon={<PortalIcon role={portalRole} className="w-4 h-4" />}
              active={activeTab === PORTAL_TAB_ID}
              onSelect={setActiveTab}
            />
          </nav>

          <div className="flex-1 min-w-2" />

          {/* District select (desktop) */}
          <select
            value={selectedCity}
            onChange={(event) => setSelectedCity(event.target.value)}
            aria-label="Filter by city"
            className="hidden md:block h-9 rounded-full bg-[#F3ECD8] border border-[#E6DCC0] px-3 font-sans text-xs font-semibold text-[#1A2225] focus:outline-none focus:border-[#55615D] cursor-pointer max-w-40"
          >
            {DAVAO_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          {/* Search (desktop) */}
          <div className="hidden md:block relative w-40 lg:w-52 shrink-0">
            <Search className="w-3.5 h-3.5 text-[#55615D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search cafes, beans"
              aria-label="Search cafes and beans"
              className="w-full h-9 bg-[#F3ECD8] border border-[#E6DCC0] rounded-full pl-8 pr-3 font-sans text-xs text-[#1A2225] placeholder:text-[#55615D] focus:outline-none focus:bg-[#FFF9E9] focus:border-[#55615D] transition-colors"
            />
          </div>

          {/* Saved with count (tablet and up) */}
          <button
            onClick={() => setActiveTab('saved')}
            aria-label={`Saved cafes and beans${savedCount ? `, ${savedCount} saved` : ''}`}
            className={`relative hidden sm:flex h-9 w-9 shrink-0 rounded-full items-center justify-center border transition-colors ${
              activeTab === 'saved'
                ? 'bg-[#1A2225] text-[#FFF9E9] border-[#1A2225]'
                : 'bg-[#F3ECD8] border-[#E6DCC0] text-[#1A2225] hover:bg-[#E6DCC0]'
            }`}
          >
            <SavedIcon className="w-4 h-4" />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-[#C86428] text-[#FFF9E9] text-[9px] font-bold flex items-center justify-center">
                {savedCount > 9 ? '9+' : savedCount}
              </span>
            )}
          </button>

          {/* Mobile menu */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            aria-label={isDrawerOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isDrawerOpen}
            className="lg:hidden h-9 w-9 shrink-0 rounded-full bg-[#F3ECD8] border border-[#E6DCC0] flex items-center justify-center text-[#1A2225] hover:bg-[#E6DCC0] transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

/** Flame mark drawn inline so the brand mark carries the roast accent without extra assets. */
const FlameMark: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" aria-hidden="true">
    <path
      d="M12 3.5c1 2.5 4.5 4.5 4.5 8.5a4.5 4.5 0 0 1-9 0c0-1.6.6-2.9 1.5-4 .2 1 .8 1.8 1.5 2.2 0-2.4.5-4.7 1.5-6.7Z"
      fill="#C86428"
    />
  </svg>
);
