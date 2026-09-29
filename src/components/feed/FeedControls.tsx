import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { SPOT_CATEGORIES, type SpotCategory } from './spotCategories';

export type FeedMode = SpotCategory;
export type SortKey = 'newest' | 'nearest' | 'mostSaved';

export const DEFAULT_SORT: SortKey = 'newest';

export const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Newest',
  nearest: 'Nearest',
  mostSaved: 'Most Saved',
};

interface FeedControlsProps {
  mode: FeedMode;
  onModeChange: (mode: FeedMode) => void;
  itemCount: number;
  isFiltersOpen?: boolean;
  onToggleFilters?: () => void;
  activeFilterCount?: number;
  onClearFilters?: () => void;
}

export const FeedControls: React.FC<FeedControlsProps> = ({
  mode,
  onModeChange,
  itemCount,
  isFiltersOpen,
  onToggleFilters,
  activeFilterCount = 0,
  onClearFilters,
}) => {
  const modes = SPOT_CATEGORIES;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Segmented control: the white thumb slides between spot categories; scrolls on narrow phones */}
      <div className="flex p-0.5 rounded-[10px] ios-fill sm:w-auto overflow-x-auto scrollbar-none" role="tablist" aria-label="Spot category">
        {modes.map((entry) => {
          const active = mode === entry.id;
          return (
            <button
              key={entry.id}
              role="tab"
              aria-selected={active}
              onClick={() => onModeChange(entry.id)}
              className="relative flex-1 sm:flex-none shrink-0 h-8 px-3 sm:px-4 rounded-[8px] text-[13px] font-semibold font-sans whitespace-nowrap"
            >
              {active && (
                <motion.span
                  layoutId="feed-mode-thumb"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  className="absolute inset-0 rounded-[8px] bg-[#FFFDF9] shadow-[0_1px_4px_rgba(19,25,31,0.14),0_0_0_0.5px_rgba(19,25,31,0.04)]"
                />
              )}
              <span className={`relative ${active ? 'text-[#13191F]' : 'text-[#594C3D]'}`}>{entry.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
        <span className="ios-footnote text-[#594C3D] font-mono">
          {itemCount} {itemCount === 1 ? 'spot' : 'spots'}
        </span>

        {/* Sort, price and must-haves all live behind the one filter button */}
        <div className="flex items-center justify-end gap-1.5">
          {onToggleFilters && (
            <button
              onClick={onToggleFilters}
              aria-expanded={isFiltersOpen}
              aria-label="Sort and filters"
              className={`relative h-8 w-8 rounded-full flex items-center justify-center ios-press ${
                isFiltersOpen || activeFilterCount > 0 ? 'bg-tint text-surface' : 'ios-fill text-ink'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-ink text-surface text-[11px] font-semibold font-mono flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="h-8 px-2 text-[13px] font-medium font-sans text-tint-ink ios-press"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
