import React from 'react';
import { NAV_TABS } from './NavigationHeader';

interface BottomTabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  savedCount: number;
  isHidden: boolean;
}

/** Persistent mobile bottom navigation (hidden while a detail modal is open). */
export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, setActiveTab, savedCount, isHidden }) => {
  if (isHidden) return null;

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-[#FFF9E9]/95 backdrop-blur-md border-t border-[#E6DCC0] tabbar-safe"
    >
      <div className="max-w-lg mx-auto flex items-stretch">
        {NAV_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex-1 h-16 flex flex-col items-center justify-center gap-1 transition-colors ${
                active ? 'text-[#1A2225]' : 'text-[#55615D]'
              }`}
            >
              <span className={`relative ${active ? 'text-[#C86428]' : ''}`}>
                <tab.icon className="w-5 h-5" />
                {tab.id === 'saved' && savedCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 rounded-full bg-[#C86428] text-[#FFF9E9] text-[9px] font-bold flex items-center justify-center">
                    {savedCount > 9 ? '9+' : savedCount}
                  </span>
                )}
              </span>
              <span className={`text-[9px] font-bold font-sans tracking-wide ${active ? 'text-[#1A2225]' : 'text-[#55615D]'}`}>
                {tab.label}
              </span>
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[#C86428]" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
