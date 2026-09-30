import React from 'react';
import { ArrowUpDown, ChevronDown } from 'lucide-react';
import { PRICE_RANGES } from '../../types/coffee';
import type { AmenityKey, PriceRange, Process, RoastLevel } from '../../types/coffee';
import { Chip } from '../common/FormControls';
import { DEFAULT_SORT, SORT_LABELS, type SortKey } from './FeedControls';

export type VibeFilterId =
  | AmenityKey
  | 'singleOrigin'
  | 'heritage'
  | 'roastery'
  | `process:${Process}`
  | `roast:${RoastLevel}`;

interface VibeFilterBarProps {
  mode: 'cafes' | 'beans';
  active: Set<VibeFilterId>;
  onToggle: (id: VibeFilterId) => void;
  isOpen?: boolean;
  sortKey?: SortKey;
  onSortChange?: (sort: SortKey) => void;
  priceRange?: PriceRange['id'];
  onPriceRangeChange?: (range: PriceRange['id']) => void;
}

const CAFE_VIBES: { id: AmenityKey | 'heritage' | 'roastery'; label: string }[] = [
  { id: 'roastery', label: 'Brews In-House' },
  { id: 'quietFocus', label: 'Quiet Focus' },
  { id: 'workFriendly', label: 'Work-Friendly' },
  { id: 'outdoor', label: 'Outdoor Garden' },
  { id: 'heritage', label: 'Ancestral House' },
  { id: 'lateNight', label: 'Late Night' },
  { id: 'petFriendly', label: 'Pet-Friendly' },
  { id: 'pourOverBar', label: 'Pour-Over Bar' },
  { id: 'oatMilk', label: 'Oat Milk' },
];

const BEAN_VIBES: { id: VibeFilterId; label: string }[] = [
  { id: 'singleOrigin', label: 'Single-Origin Only' },
  { id: 'process:Anaerobic Natural', label: 'Anaerobic' },
  { id: 'process:Honey', label: 'Honey' },
  { id: 'process:Natural', label: 'Natural' },
  { id: 'process:Washed', label: 'Washed' },
  { id: 'roast:Light', label: 'Light Roast' },
  { id: 'roast:Medium-Light', label: 'Medium-Light' },
  { id: 'roast:Medium', label: 'Medium' },
  { id: 'roast:Medium-Dark', label: 'Medium-Dark' },
  { id: 'roast:Dark', label: 'Dark' },
];

const menuClass =
  'relative flex items-center gap-1 h-8 pl-3 pr-2 rounded-full ios-fill focus-within:ring-2 focus-within:ring-tint/50 text-[13px] font-medium font-sans text-ink hover:bg-shade/20 transition-colors';

/**
 * The filter panel under the feed controls. Open: sort and price menus, then the must-have chip rail.
 * Closed: only the choices that are in effect, each as a chip that removes itself, so nothing filters unseen.
 */
export const VibeFilterBar: React.FC<VibeFilterBarProps> = ({
  mode,
  active,
  onToggle,
  isOpen = true,
  sortKey = DEFAULT_SORT,
  onSortChange,
  priceRange = 'any',
  onPriceRangeChange,
}) => {
  const vibes = mode === 'cafes' ? CAFE_VIBES : BEAN_VIBES;
  const sortChanged = Boolean(onSortChange) && sortKey !== DEFAULT_SORT;
  const priceSet = Boolean(onPriceRangeChange) && priceRange !== 'any';
  const priceLabel = PRICE_RANGES.find((range) => range.id === priceRange)?.label ?? '';
  const groupLabel = mode === 'cafes' ? 'Cafe filters' : 'Bean filters';

  if (!isOpen) {
    const chosen = vibes.filter((vibe) => active.has(vibe.id));
    if (chosen.length === 0 && !sortChanged && !priceSet) return null;
    return (
      <div className="-mx-4 sm:mx-0">
        <div className="ios-shelf gap-2 px-4 sm:px-0 sm:flex-wrap py-0.5" role="group" aria-label={`Active ${groupLabel.toLowerCase()}`}>
          {sortChanged && <Chip label={SORT_LABELS[sortKey]} active onClick={() => onSortChange?.(DEFAULT_SORT)} />}
          {priceSet && <Chip label={priceLabel} active onClick={() => onPriceRangeChange?.('any')} />}
          {chosen.map((vibe) => (
            <Chip key={vibe.id} label={vibe.label} active onClick={() => onToggle(vibe.id)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {(onSortChange || onPriceRangeChange) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {onSortChange && (
            <label className={menuClass}>
              <ArrowUpDown className="w-3.5 h-3.5 text-ink-2" />
              {/* The select lies transparently over the whole pill, so the icon and chevron open it too */}
              <span aria-hidden="true">{SORT_LABELS[sortKey]}</span>
              <select
                value={sortKey}
                onChange={(e) => onSortChange(e.target.value as SortKey)}
                aria-label="Sort feed"
                className="select-overlay"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABELS[key]}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-ink-2" />
            </label>
          )}

          {onPriceRangeChange && (
            <label className={menuClass}>
              <span aria-hidden="true">{priceLabel}</span>
              <select
                value={priceRange}
                onChange={(e) => onPriceRangeChange(e.target.value as PriceRange['id'])}
                aria-label="Filter price"
                className="select-overlay"
              >
                {PRICE_RANGES.map((range) => (
                  <option key={range.id} value={range.id}>
                    {range.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-ink-2" />
            </label>
          )}
        </div>
      )}

      <div className="-mx-4 sm:mx-0">
        <div className="ios-shelf gap-2 px-4 sm:px-0 sm:flex-wrap py-0.5" role="group" aria-label={groupLabel}>
          {vibes.map((vibe) => (
            <Chip
              key={vibe.id}
              label={vibe.label}
              active={active.has(vibe.id)}
              onClick={() => onToggle(vibe.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
