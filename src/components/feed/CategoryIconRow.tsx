import React from 'react';
import { PawPrint, Plug, Snowflake, Trees, Wifi } from 'lucide-react';
import { V60DripperIcon } from '../common/CustomIcons';
import type { AmenityKey } from '../../types/coffee';
import type { VibeFilterId } from './VibeFilterBar';

/** Amenity shortcuts: each toggles the matching amenity filter on the spot list. */
export type MainCategoryId = Extract<AmenityKey, 'plugs' | 'fastWifi' | 'aircon' | 'outdoor' | 'petFriendly' | 'pourOverBar'>;

export interface CategoryItem {
  id: MainCategoryId;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

export const MAIN_CATEGORIES: CategoryItem[] = [
  { id: 'plugs', label: 'Plugs', icon: Plug },
  { id: 'fastWifi', label: 'Fast Wi-Fi', icon: Wifi },
  { id: 'aircon', label: 'Air-con', icon: Snowflake },
  { id: 'outdoor', label: 'Outdoor', icon: Trees },
  { id: 'petFriendly', label: 'Pet-Friendly', icon: PawPrint },
  { id: 'pourOverBar', label: 'Pour-Over', icon: V60DripperIcon },
];

interface CategoryIconRowProps {
  activeFilters: Set<VibeFilterId>;
  onSelectCategory: (id: MainCategoryId) => void;
}

export const CategoryIconRow: React.FC<CategoryIconRowProps> = ({ activeFilters, onSelectCategory }) => {
  return (
    <section aria-label="Filter by amenity" data-tour="categories" className="-mx-4 sm:mx-0">
      <div className="ios-shelf gap-2 px-4 sm:px-0 sm:grid sm:grid-cols-6 sm:gap-3">
        {MAIN_CATEGORIES.map((cat) => {
          const isActive = activeFilters.has(cat.id);
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
