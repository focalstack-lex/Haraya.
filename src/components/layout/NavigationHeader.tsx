import React, { useEffect, useState } from 'react';
import { Menu, Search, ShieldCheck, UserRound, X } from 'lucide-react';
import { FeedIcon, MapIcon, SavedIcon, RoasterIcon, AddSpotIcon } from '../common/CustomIcons';
import { BrandLogo } from '../common/BrandLogo';
import { DAVAO_CITIES } from '../../types/coffee';
import type { PortalRole } from '../../types/auth';

/**
 * The legacy roaster portal (sign-in, roaster dashboard, admin panel). Hidden from navigation since the
 * discovery pivot; the code stays so it can return. Reachable only by its hash route.
 */
export const PORTAL_TAB_ID = 'roaster';

/** Tab id of the community submission flow that replaced the roaster portal in navigation. */
export const SUBMIT_TAB_ID = 'submit';

export const NAV_TABS: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'feed', label: 'Discover', icon: FeedIcon },
  { id: 'map', label: 'Map & Spots', icon: MapIcon },
  { id: SUBMIT_TAB_ID, label: 'Add a Spot', icon: AddSpotIcon },
  { id: 'profile', label: 'Saved Spots', icon: SavedIcon },
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
  onOpenWelcome?: () => void;
}

interface TabButtonProps {
  id: string;
  label: string;
  count?: number;
  active: boolean;
  onSelect: (id: string) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ id, label, count, active, onSelect }) => (
  <button
    onClick={() => onSelect(id)}
    data-tour={`tab-${id}`}
    aria-current={active ? 'page' : undefined}
    className={`h-8 px-4 rounded-full text-[13px] font-semibold font-sans ios-press flex items-center gap-1.5 ${
      active ? 'bg-[#FFFDF9] text-[#13191F] shadow-[0_1px_3px_rgba(19,25,31,0.12)]' : 'text-[#594C3D] hover:text-[#13191F]'
    }`}
  >
    {label}
    {count !== undefined && count > 0 && (
      <span className="h-4 min-w-4 px-1 rounded-full bg-[#906D4B] text-[#FFFDF9] text-[9px] font-bold flex items-center justify-center">
        {count}
      </span>
    )}
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
  onOpenWelcome,
}) => {
  // iOS bar behavior: transparent over the page top, material plus hairline once content scrolls under it
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Discover carries its own search field and city menu, so the bar only shows them elsewhere
  const showBarSearch = activeTab !== 'feed';

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300 pt-[env(safe-area-inset-top)] ${
        scrolled ? 'ios-material-bar ios-hairline-b' : 'bg-[#FAF5EB]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-13 sm:h-15">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('feed')}
              className="flex items-center ios-press min-h-11"
              aria-label="Haraya home"
            >
              <BrandLogo className="h-11 sm:h-12" eager />
            </button>
          </div>

          {/* Clean Desktop Navigation (Text links without icon clutter) */}
          <nav className="hidden lg:flex items-center gap-0.5 p-0.5 rounded-full ios-fill" aria-label="Primary">
            {NAV_TABS.map((tab) => (
              <TabButton
                key={tab.id}
                id={tab.id}
                label={tab.label}
                count={tab.id === 'profile' ? savedCount : undefined}
                active={activeTab === tab.id}
                onSelect={setActiveTab}
              />
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Unified Search & City Filter Capsule on Desktop */}
            <div className={`${showBarSearch ? 'hidden md:flex' : 'hidden'} items-center ios-fill rounded-[10px] h-9 transition-colors overflow-hidden`}>
              {showBarSearch && (
              <div className="relative flex items-center pl-2.5 pr-1">
                <Search className="w-4 h-4 text-[#6E6150] shrink-0 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search spots"
                  aria-label="Search cafes and study spots"
                  className="w-28 lg:w-40 bg-transparent pl-2 pr-2 font-sans text-[13px] text-[#13191F] placeholder:text-[#6E6150] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="h-4.5 w-4.5 rounded-full bg-[#6E6150]/70 text-[#FFFDF9] flex items-center justify-center mr-1"
                  >
                    <X className="w-3 h-3" strokeWidth={3} />
                  </button>
                )}
              </div>
              )}

              {showBarSearch && <div className="h-4 w-px bg-[#594C3D]/20" />}

              <select
                value={selectedCity}
                onChange={(event) => setSelectedCity(event.target.value)}
                aria-label="Filter by city"
                className="bg-transparent appearance-none px-3 h-9 font-sans text-[13px] font-semibold text-[#7D5C3D] focus:outline-none cursor-pointer"
              >
                {DAVAO_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city === 'All Davao Region' ? 'All Davao' : city}
                  </option>
                ))}
              </select>
            </div>

            {/* Welcome / Get Started Button for guests */}
            {portalRole === 'guest' && onOpenWelcome && (
              <button
                onClick={onOpenWelcome}
                className="hidden sm:inline-flex items-center h-9 px-4 rounded-full bg-[#906D4B] text-[#FFFDF9] text-[13px] font-semibold font-sans hover:bg-[#7D5C3D] ios-press"
              >
                Get Started
              </button>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              aria-label={isDrawerOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isDrawerOpen}
              className="lg:hidden h-11 w-11 -mr-1.5 rounded-full flex items-center justify-center ios-press"
            >
              <span className="h-8.5 w-8.5 rounded-full ios-fill flex items-center justify-center text-[#13191F]">
                <Menu className="w-4.5 h-4.5" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
