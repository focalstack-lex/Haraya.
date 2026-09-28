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
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden ios-material-bar ios-hairline-t tabbar-safe"
    >
      <div className="max-w-lg mx-auto flex items-stretch">
        {NAV_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-tour={`tab-${tab.id}`}
              aria-current={active ? 'page' : undefined}
              className={`relative flex-1 h-[52px] pt-1.5 flex flex-col items-center justify-start gap-0.5 ios-press ${
                active ? 'text-[#7D5C3D]' : 'text-[#6E6150]'
              }`}
            >
              <span className="relative">
                <tab.icon className="w-6 h-6" />
                {tab.id === 'profile' && savedCount > 0 && (
                  <span className="absolute -top-1 -right-2.5 h-4.5 min-w-4.5 px-1 rounded-full bg-[#8C3A2E] text-[#FFFDF9] text-[10px] font-semibold font-mono flex items-center justify-center ring-2 ring-[#FAF5EB]">
                    {savedCount > 9 ? '9+' : savedCount}
                  </span>
                )}
              </span>
              <span className={`ios-caption text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
