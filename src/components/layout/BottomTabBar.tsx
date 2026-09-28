import React from 'react';
import { NAV_TABS } from './NavigationHeader';

interface BottomTabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  savedCount: number;
  isHidden: boolean;
}

/**
 * Persistent mobile bottom navigation (hidden while a detail modal is open). A floating surface bar: the
 * active tab sits on a tint arch that rises above the bar and slides between tabs (see `.dock` in
 * index.css). Tabs outside NAV_TABS (the hash-only portal) leave the bar without an arch.
 */
export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, setActiveTab, savedCount, isHidden }) => {
  if (isHidden) return null;

  const activeIndex = NAV_TABS.findIndex((tab) => tab.id === activeTab);
  const dockVars = { '--dock-i': Math.max(activeIndex, 0), '--dock-n': NAV_TABS.length } as React.CSSProperties;

  return (
    <nav aria-label="Bottom navigation" className="fixed bottom-0 inset-x-0 z-50 lg:hidden px-3 tabbar-safe pointer-events-none">
      <div className="dock relative mx-auto max-w-md pointer-events-auto" style={dockVars}>
        <div aria-hidden="true" className="dock-bar absolute inset-0 rounded-[22px]" />
        {activeIndex >= 0 && (
          <span aria-hidden="true" className="dock-pill absolute left-0 top-[-14px] bottom-0" />
        )}

        <div className="relative flex h-[64px] px-[10px]">
          {NAV_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-tour={`tab-${tab.id}`}
                aria-current={active ? 'page' : undefined}
                className="relative flex-1 min-w-0 flex justify-center ios-press"
              >
                <span
                  className={`dock-item mt-[12px] max-w-full flex flex-col items-center gap-[5px] ${
                    active ? 'translate-y-[-5px] text-[#FFFDF9]' : 'text-[color:var(--ios-label-3)]'
                  }`}
                >
                  <span className="relative w-[24px] h-[24px] flex items-center justify-center">
                    <tab.icon className="w-6 h-6" />
                    {tab.id === 'profile' && savedCount > 0 && (
                      <span
                        className={`absolute -top-1 -right-2.5 h-4.5 min-w-4.5 px-1 rounded-full bg-[#8C3A2E] text-[#FFFDF9] text-[10px] font-semibold font-mono flex items-center justify-center ring-2 ${
                          active ? 'ring-[color:var(--ios-tint)]' : 'ring-[color:var(--ios-surface)]'
                        }`}
                      >
                        {savedCount > 9 ? '9+' : savedCount}
                      </span>
                    )}
                  </span>
                  <span className={`ios-caption text-[10px] leading-[13px] max-w-full truncate px-1 ${active ? 'font-semibold' : 'font-medium'}`}>
                    {tab.label}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
