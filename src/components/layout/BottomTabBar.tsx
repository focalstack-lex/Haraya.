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


  return (
    <nav aria-label="Bottom navigation" className="fixed bottom-0 inset-x-0 z-50 lg:hidden px-4 tabbar-safe pointer-events-none">
      <div className="dock relative mx-auto max-w-md pointer-events-auto">
        <div aria-hidden="true" className="dock-bar absolute inset-0 rounded-full" />

        <div className="relative flex h-[58px] px-1 items-center">
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
                      active ? 'text-tint' : 'text-ink-3 hover:text-ink-2'
                    }`}
                  />
                  {tab.id === 'profile' && savedCount > 0 && (
                    <span
                      className="absolute -top-1 -right-2 h-4 min-w-4 px-1 rounded-full bg-danger text-surface text-[11px] font-semibold font-mono flex items-center justify-center ring-2 ring-surface"
                    >
                      {savedCount > 9 ? '9+' : savedCount}
                    </span>
                  )}
                </span>
                <span
                  className={`ios-caption leading-[13px] max-w-full truncate transition-colors duration-200 ${
                    active ? 'font-semibold text-tint-ink' : 'font-medium text-ink-3'
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

