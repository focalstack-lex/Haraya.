import React from 'react';
import { ClipboardList } from 'lucide-react';
import { PRICE_RANGES } from '../../types/coffee';
import type { PriceRange } from '../../types/coffee';

export type FeedMode = 'cafes' | 'beans' | 'following';
export type SortKey = 'newest' | 'nearest' | 'mostSaved';

export const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Newest',
  nearest: 'Nearest',
  mostSaved: 'Most Saved',
};

interface FeedControlsProps {
  mode: FeedMode;
  onModeChange: (mode: FeedMode) => void;
  followingCount: number;
  sortKey: SortKey;
  onSortChange: (sort: SortKey) => void;
  priceRange: PriceRange['id'];
  onPriceRangeChange: (range: PriceRange['id']) => void;
}

/**
 * Distilled Row 1 control bar: mode switcher on the left, quick filters on the
 * right. No vertical filter bloat: vibes and brew methods live in Row 2.
 */
export const FeedControls: React.FC<FeedControlsProps> = ({
  mode,
  onModeChange,
  followingCount,
  sortKey,
  onSortChange,
  priceRange,
  onPriceRangeChange,
}) => {
  const modes: { id: FeedMode; label: string }[] = [
    { id: 'cafes', label: 'Explore Cafes' },
    { id: 'beans', label: 'Fresh Beans' },
    { id: 'following', label: `Following${followingCount > 0 ? ` (${followingCount})` : ''}` },
  ];

  const pill = (active: boolean) =>
    `h-9 px-3.5 rounded-full text-xs font-bold font-sans whitespace-nowrap transition-colors ${
      active ? 'bg-[#1A2225] text-[#FFF9E9]' : 'text-[#1A2225] hover:bg-[#F3ECD8]'
    }`;

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex items-center rounded-full bg-[#F3ECD8] border border-[#E6DCC0] p-1 shrink-0" role="tablist" aria-label="Feed mode">
        {modes.map((entry) => (
          <button
            key={entry.id}
            role="tab"
            aria-selected={mode === entry.id}
            onClick={() => onModeChange(entry.id)}
            className={pill(mode === entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-[#E6DCC0] shrink-0" aria-hidden="true" />

      <div className="flex items-center gap-2 shrink-0">
        <ClipboardList className="w-3.5 h-3.5 text-[#55615D]" aria-hidden="true" />
        {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
          <button key={key} onClick={() => onSortChange(key)} className={pill(sortKey === key)} aria-pressed={sortKey === key}>
            {SORT_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-[#E6DCC0] shrink-0" aria-hidden="true" />

      <div className="flex items-center gap-2 shrink-0">
        {PRICE_RANGES.map((range) => (
          <button
            key={range.id}
            onClick={() => onPriceRangeChange(range.id)}
            aria-pressed={priceRange === range.id}
            className={pill(priceRange === range.id)}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
};
