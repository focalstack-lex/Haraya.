import React from 'react';
import { NAV_TABS } from './NavigationHeader';

interface BottomTabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  savedCount: number;
  isHidden: boolean;
}

/**
 * Persistent mobile bottom navigation (hidden while a detail modal is open).
 * Minimalist flush floating dock: warm linen surface with subtle hairline border,
 * quiet inactive tabs, warm roasted coffee active tint, and a smooth sliding micro-indicator.
 */
export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, setActiveTab, savedCount, isHidden }) => {
  if (isHidden) return null;

  const activeIndex = NAV_TABS.findIndex((tab) => tab.id === activeTab);
  const dockVars = { '--dock-i': Math.max(activeIndex, 0), '--dock-n': NAV_TABS.length } as React.CSSProperties;

  return (
    <nav aria-label="Bottom navigation" className="fixed bottom-0 inset-x-0 z-50 lg:hidden px-4 tabbar-safe pointer-events-none">
      <div className="dock relative mx-auto max-w-md pointer-events-auto" style={dockVars}>
        <div aria-hidden="true" className="dock-bar absolute inset-0 rounded-full" />
        
        {activeIndex >= 0 && (
          <span
            aria-hidden="true"
            className="dock-indicator absolute bottom-[6px] left-0 pointer-events-none"
          />
        )}

        <div className="relative flex h-[58px] px-2 items-center">
          {NAV_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-tour={`tab-${tab.id}`}
                aria-current={active ? 'page' : undefined}
                className="relative flex-1 min-w-0 h-full flex flex-col items-center justify-center pt-1.5 pb-2.5 gap-1 ios-press select-none"
              >
                <span className="relative w-6 h-6 flex items-center justify-center">
                  <tab.icon
                    className={`w-[22px] h-[22px] transition-colors duration-200 ${
                      active ? 'text-[#906D4B]' : 'text-[#8C7E70] hover:text-[#594C3D]'
                    }`}
                  />
                  {tab.id === 'profile' && savedCount > 0 && (
                    <span
                      className="absolute -top-1 -right-2 h-4 min-w-4 px-1 rounded-full bg-[#8C3A2E] text-[#FFFDF9] text-[9.5px] font-semibold font-mono flex items-center justify-center ring-2 ring-[#FFFDF9]"
                    >
                      {savedCount > 9 ? '9+' : savedCount}
                    </span>
                  )}
                </span>
                <span
                  className={`ios-caption text-[10.5px] leading-[13px] max-w-full truncate px-1 transition-colors duration-200 ${
                    active ? 'font-semibold text-[#7D5C3D]' : 'font-medium text-[#8C7E70]'
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

