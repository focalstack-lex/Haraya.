import React from 'react';
import { NAV_TABS } from './NavigationHeader';

interface BottomTabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  savedCount: number;
  isHidden: boolean;
}

/**
 * Persistent mobile bottom navigation (hidden while a detail modal is open). A floating dock: the
 * active tab's icon lifts into a puck that sits in a notch carved out of the bar (see `.dock` in
 * index.css). Tabs outside NAV_TABS (the hash-only portal) leave the bar flat with no puck.
 */
export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, setActiveTab, savedCount, isHidden }) => {
  if (isHidden) return null;

  const activeIndex = NAV_TABS.findIndex((tab) => tab.id === activeTab);
  const hasActive = activeIndex >= 0;
  const dockVars = { '--dock-i': Math.max(activeIndex, 0), '--dock-n': NAV_TABS.length } as React.CSSProperties;

  return (
    <nav aria-label="Bottom navigation" className="fixed bottom-0 inset-x-0 z-50 lg:hidden px-3 tabbar-safe pointer-events-none">
      <div className="dock relative mx-auto max-w-md pointer-events-auto" style={dockVars}>
        <div aria-hidden="true" data-notched={hasActive ? '' : undefined} className="dock-bar absolute inset-0 rounded-[22px]" />
        {hasActive && <span aria-hidden="true" className="dock-puck absolute left-0 top-[-20px] w-[48px] h-[48px] rounded-full" />}

        <div className="relative flex h-[64px] px-[10px]">
          {NAV_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-tour={`tab-${tab.id}`}
                aria-current={active ? 'page' : undefined}
                className="relative flex-1 min-w-0 flex flex-col items-center justify-end pb-[9px] ios-press"
              >
                <span
                  className={`dock-icon absolute top-[12px] left-1/2 -ml-[12px] w-[24px] h-[24px] flex items-center justify-center ${
                    active ? 'translate-y-[-20px] text-[color:var(--ios-dock)]' : 'text-[color:var(--ios-dock-label)]'
                  }`}
                >
                  <tab.icon className="w-6 h-6" />
                  {tab.id === 'profile' && savedCount > 0 && (
                    <span className="absolute -top-1 -right-2.5 h-4.5 min-w-4.5 px-1 rounded-full bg-[#8C3A2E] text-[#FFFDF9] text-[10px] font-semibold font-mono flex items-center justify-center ring-2 ring-[color:var(--ios-dock)]">
                      {savedCount > 9 ? '9+' : savedCount}
                    </span>
                  )}
                </span>
                <span
                  className={`ios-caption text-[10px] max-w-full truncate px-1 ${
                    active ? 'font-semibold text-[color:var(--ios-dock-accent)]' : 'font-medium text-[color:var(--ios-dock-label)]'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
