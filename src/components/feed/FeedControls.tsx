import React from 'react';
import { ArrowUpDown, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { PRICE_RANGES } from '../../types/coffee';
import type { PriceRange } from '../../types/coffee';
import { SPOT_CATEGORIES, type SpotCategory } from './spotCategories';

export type FeedMode = SpotCategory;
export type SortKey = 'newest' | 'nearest' | 'mostSaved';

export const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Newest',
  nearest: 'Nearest',
  mostSaved: 'Most Saved',
};

interface FeedControlsProps {
  mode: FeedMode;
  onModeChange: (mode: FeedMode) => void;
  sortKey: SortKey;
  onSortChange: (sort: SortKey) => void;
  priceRange: PriceRange['id'];
  onPriceRangeChange: (range: PriceRange['id']) => void;
  itemCount: number;
  isFiltersOpen?: boolean;
  onToggleFilters?: () => void;
  activeFilterCount?: number;
  onClearFilters?: () => void;
}

export const FeedControls: React.FC<FeedControlsProps> = ({
  mode,
  onModeChange,
  sortKey,
  onSortChange,
  priceRange,
  onPriceRangeChange,
  itemCount,
  isFiltersOpen,
  onToggleFilters,
  activeFilterCount = 0,
  onClearFilters,
}) => {
  const modes = SPOT_CATEGORIES;

  const menuClass =
    'flex items-center gap-1 h-8 pl-3 pr-2 rounded-full ios-fill text-[13px] font-medium font-sans text-[#13191F] hover:bg-[#766046]/20 transition-colors';

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

      <div className="flex items-center justify-between sm:justify-end gap-2">
        <span className="ios-footnote text-[#594C3D] font-mono">
          {itemCount} {itemCount === 1 ? 'spot' : 'spots'}
        </span>

        <div className="flex items-center gap-1.5">
          <label className={menuClass}>
            <ArrowUpDown className="w-3.5 h-3.5 text-[#594C3D]" />
            <select
              value={sortKey}
              onChange={(e) => onSortChange(e.target.value as SortKey)}
              aria-label="Sort feed"
              className="bg-transparent focus:outline-none cursor-pointer appearance-none pr-0.5"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#594C3D]" />
          </label>

          <label className={menuClass}>
            <select
              value={priceRange}
              onChange={(e) => onPriceRangeChange(e.target.value as PriceRange['id'])}
              aria-label="Filter price"
              className="bg-transparent focus:outline-none cursor-pointer appearance-none pr-0.5"
            >
              {PRICE_RANGES.map((range) => (
                <option key={range.id} value={range.id}>
                  {range.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#594C3D]" />
          </label>

          {onToggleFilters && (
            <button
              onClick={onToggleFilters}
              aria-expanded={isFiltersOpen}
              aria-label="Filters"
              className={`relative h-8 w-8 rounded-full flex items-center justify-center ios-press ${
                isFiltersOpen || activeFilterCount > 0 ? 'bg-[#906D4B] text-[#FFFDF9]' : 'ios-fill text-[#13191F]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-[#13191F] text-[#FFFDF9] text-[10px] font-semibold font-mono flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="h-8 px-2 text-[13px] font-medium font-sans text-[#7D5C3D] ios-press"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
