import React from 'react';
import { Laptop, Moon, Trees } from 'lucide-react';
import { CoffeeBagIcon, RoasterDrumIcon, V60DripperIcon } from '../common/CustomIcons';
import type { VibeFilterId } from './VibeFilterBar';

/** Shortcut categories: 'beans' switches the catalog to the bean vault, the rest toggle a cafe filter. */
export type MainCategoryId = 'roastery' | 'beans' | 'pourOverBar' | 'workFriendly' | 'lateNight' | 'outdoor';

export interface CategoryItem {
  id: MainCategoryId;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

export const MAIN_CATEGORIES: CategoryItem[] = [
  { id: 'roastery', label: 'Roasteries', icon: RoasterDrumIcon },
  { id: 'beans', label: 'Beans', icon: CoffeeBagIcon },
  { id: 'pourOverBar', label: 'Pour-Over', icon: V60DripperIcon },
  { id: 'workFriendly', label: 'Work', icon: Laptop },
  { id: 'lateNight', label: 'Late Night', icon: Moon },
  { id: 'outdoor', label: 'Outdoor', icon: Trees },
];

interface CategoryIconRowProps {
  showingBeans: boolean;
  activeFilters: Set<VibeFilterId>;
  onSelectCategory: (id: MainCategoryId) => void;
}

export const CategoryIconRow: React.FC<CategoryIconRowProps> = ({ showingBeans, activeFilters, onSelectCategory }) => {
  return (
    <section aria-label="Browse by category" className="-mx-4 sm:mx-0">
      <div className="ios-shelf gap-2 px-4 sm:px-0 sm:grid sm:grid-cols-6 sm:gap-3">
        {MAIN_CATEGORIES.map((cat) => {
          const isActive = cat.id === 'beans' ? showingBeans : !showingBeans && activeFilters.has(cat.id);
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              aria-pressed={isActive}
              className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] sm:w-auto py-1 ios-press"
            >
              <span
                className={`h-[58px] w-[58px] sm:h-16 sm:w-16 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isActive ? 'bg-[#906D4B] text-[#FFFDF9]' : 'bg-[#FFFDF9] text-[#594C3D] ios-card-shadow'
                }`}
              >
                <Icon className="w-6.5 h-6.5" strokeWidth={1.8} />
              </span>
              <span className={`ios-caption text-[12px] ${isActive ? 'text-[#7D5C3D] font-semibold' : 'text-[#594C3D]'}`}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
