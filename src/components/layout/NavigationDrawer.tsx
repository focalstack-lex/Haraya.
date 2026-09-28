import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, LogOut, ShieldCheck, UserRound, Check, ChevronRight, ChevronsUpDown, MapPin } from 'lucide-react';
import { NAV_TABS, PORTAL_TAB_ID, PORTAL_LABELS, PortalIcon } from './NavigationHeader';
import { BrandLogo } from '../common/BrandLogo';
import { DAVAO_CITIES } from '../../types/coffee';
import type { PortalRole } from '../../types/auth';

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

const PANEL_SPRING = { type: 'spring', stiffness: 380, damping: 38, mass: 0.9 } as const;

/** Leading icon of a grouped row: a 30px tinted rounded square. */
const RowIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="h-7.5 w-7.5 shrink-0 rounded-[8px] bg-[#906D4B]/15 text-[#7D5C3D] flex items-center justify-center">
    {children}
  </span>
);

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
  const reduceMotion = useReducedMotion();

  const go = (id: string) => {
    setActiveTab(id);
    onClose();
  };

  const navRow = (id: string, label: string, icon: React.ReactNode, trailing?: React.ReactNode) => {
    const active = activeTab === id;
    return (
      <button
        key={id}
        onClick={() => go(id)}
        aria-current={active ? 'page' : undefined}
        className="ios-group-row ios-press"
      >
        <RowIcon>{icon}</RowIcon>
        <span className={`flex-1 min-w-0 truncate text-[15px] ${active ? 'text-[#7D5C3D] font-semibold' : 'text-[#13191F]'}`}>
          {label}
        </span>
        {trailing}
        {active ? (
          <Check className="w-4.5 h-4.5 shrink-0 text-[#7D5C3D]" strokeWidth={2.5} />
        ) : (
          <ChevronRight className="w-4 h-4 shrink-0 text-[#6E6150]/60" strokeWidth={2.5} />
        )}
      </button>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="nav-drawer" className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <motion.div
            className="absolute inset-0 bg-[#13191F]/40"
            onMouseDown={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <motion.div
            className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-[#FAF5EB] rounded-l-[24px] shadow-[-8px_0_40px_rgba(19,25,31,0.18)] flex flex-col overflow-hidden"
            initial={reduceMotion ? { opacity: 0 } : { x: '100%' }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { x: '100%' }}
            transition={PANEL_SPRING}
          >
            <div className="flex items-center justify-between pl-5 pr-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))] h-auto min-h-14">
              <BrandLogo className="h-11" />
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="h-11 w-11 shrink-0 flex items-center justify-center ios-press"
              >
                <span className="h-7.5 w-7.5 rounded-full bg-[#766046]/15 flex items-center justify-center text-[#594C3D]">
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </span>
              </button>
            </div>

            <nav
              className={`flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-4 space-y-6 ${portalRole === 'guest' ? 'sheet-safe' : ''}`}
              aria-label="Mobile"
            >
              <div className="ios-group">
                {NAV_TABS.map((tab) =>
                  navRow(
                    tab.id,
                    tab.label,
                    <tab.icon className="w-4.5 h-4.5" />,
                    tab.id === 'profile' && savedCount > 0 ? (
                      <span className="h-5 min-w-5 px-1.5 shrink-0 rounded-full bg-[#906D4B] text-[#FFFDF9] text-[11px] font-semibold font-mono flex items-center justify-center">
                        {savedCount}
                      </span>
                    ) : undefined,
                  ),
                )}
                {navRow(PORTAL_TAB_ID, PORTAL_LABELS[portalRole].long, <PortalIcon role={portalRole} className="w-4.5 h-4.5" />)}
              </div>

              <div className="ios-group">
                <label className="ios-group-row relative cursor-pointer">
                  <RowIcon>
                    <MapPin className="w-4 h-4" strokeWidth={2.2} />
                  </RowIcon>
                  <span className="flex-1 text-[15px] text-[#13191F]">City</span>
                  <span className="min-w-0 truncate text-[15px] text-[#6E6150]">{selectedCity}</span>
                  <ChevronsUpDown className="w-4 h-4 shrink-0 text-[#6E6150]" />
                  <select
                    value={selectedCity}
                    onChange={(event) => setSelectedCity(event.target.value)}
                    aria-label="Filter by city"
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  >
                    {DAVAO_CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </nav>

            {portalRole !== 'guest' && (
              <div className="px-4 pt-2 space-y-3 sheet-safe">
                <div className="ios-group">
                  <div className="ios-group-row">
                    <RowIcon>
                      {portalRole === 'admin' ? (
                        <ShieldCheck className="w-4 h-4" strokeWidth={2.2} />
                      ) : (
                        <UserRound className="w-4 h-4" strokeWidth={2.2} />
                      )}
                    </RowIcon>
                    <span className="flex-1 min-w-0 truncate text-[15px] text-[#13191F]">{accountName ?? 'Signed in'}</span>
                  </div>
                </div>
                <div className="ios-group">
                  <button
                    onClick={() => {
                      onSignOut();
                      onClose();
                    }}
                    className="ios-group-row ios-press text-[15px] text-[#8C3A2E]"
                  >
                    <LogOut className="w-4.5 h-4.5 shrink-0" strokeWidth={2.2} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
