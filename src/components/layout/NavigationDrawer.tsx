import React from 'react';
import { X, ArrowLeftRight, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { NAV_TABS, PORTAL_TAB_ID, PORTAL_LABELS, PortalIcon } from './NavigationHeader';
import { DAVAO_CITIES } from '../../types/coffee';
import type { PortalRole } from '../../types/auth';
import { SISTER_PLATFORM } from '../../config/ecosystem';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  savedCount: number;
  portalRole: PortalRole;
  accountName: string | null;
  onSignOut: () => void;
}

/** Mobile slide-over navigation with the district filter and account controls. */
export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  selectedCity,
  setSelectedCity,
  savedCount,
  portalRole,
  accountName,
  onSignOut,
}) => {
  if (!isOpen) return null;

  const go = (id: string) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <div className="absolute inset-0 bg-[#1A2225]/55 backdrop-blur-sm" onMouseDown={onClose} />
      <div className="absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-[#FFF9E9] border-l border-[#E6DCC0] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 h-14 border-b border-[#E6DCC0]">
          <span className="font-cooper text-lg font-bold text-[#1A2225]">Haraya</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="h-9 w-9 rounded-full bg-[#F3ECD8] border border-[#E6DCC0] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1" aria-label="Mobile">
          {NAV_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => go(tab.id)}
              className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 text-sm font-semibold font-sans transition-colors ${
                activeTab === tab.id ? 'bg-[#1A2225] text-[#FFF9E9]' : 'text-[#1A2225] hover:bg-[#F3ECD8]'
              }`}
            >
              <tab.icon className="w-4.5 h-4.5" />
              {tab.label}
              {tab.id === 'saved' && savedCount > 0 && (
                <span className="ml-auto h-5 min-w-5 px-1.5 rounded-full bg-[#C86428] text-[#FFF9E9] text-[10px] font-bold flex items-center justify-center">
                  {savedCount}
                </span>
              )}
            </button>
          ))}

          <button
            onClick={() => go(PORTAL_TAB_ID)}
            className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 text-sm font-semibold font-sans transition-colors ${
              activeTab === PORTAL_TAB_ID ? 'bg-[#1A2225] text-[#FFF9E9]' : 'text-[#1A2225] hover:bg-[#F3ECD8]'
            }`}
          >
            <PortalIcon role={portalRole} className="w-4.5 h-4.5" />
            {PORTAL_LABELS[portalRole].long}
          </button>

          <div className="pt-3 space-y-1.5">
            <span className="block px-1 text-[10px] font-bold uppercase tracking-widest text-[#55615D] font-sans">City</span>
            <select
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value)}
              aria-label="Filter by city"
              className="w-full h-10 rounded-xl bg-[#F3ECD8] border border-[#E6DCC0] px-3 font-sans text-sm font-semibold text-[#1A2225] focus:outline-none"
            >
              {DAVAO_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </nav>

        <div className="border-t border-[#E6DCC0] p-3 space-y-2 sheet-safe">
          <a
            href={SISTER_PLATFORM.url}
            className="w-full h-11 px-3 rounded-xl flex items-center gap-3 text-sm font-semibold font-sans text-[#1A2225] bg-[#F3ECD8] border border-[#E6DCC0]"
          >
            <ArrowLeftRight className="w-4 h-4 text-[#55615D]" />
            Switch to Habi Fashion
          </a>
          {portalRole !== 'guest' && (
            <div className="flex items-center gap-2 px-1">
              <span className="flex-1 text-xs font-sans text-[#55615D] truncate">
                {portalRole === 'admin' ? <ShieldCheck className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> : <UserRound className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                {accountName ?? 'Signed in'}
              </span>
              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="h-9 px-3 rounded-full border border-[#E6DCC0] text-xs font-bold font-sans text-[#1A2225] flex items-center gap-1.5 hover:bg-[#F3ECD8]"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
