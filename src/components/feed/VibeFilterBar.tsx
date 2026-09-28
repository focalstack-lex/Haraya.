import React from 'react';
import type { AmenityKey, Process, RoastLevel } from '../../types/coffee';
import { Chip } from '../common/FormControls';

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

/**
 * Collapsible amenity and vibe chip rail: expands when toggled or active.
 */
export const VibeFilterBar: React.FC<VibeFilterBarProps> = ({ mode, active, onToggle, isOpen = true }) => {
  if (!isOpen && active.size === 0) return null;

  const vibes = mode === 'cafes' ? CAFE_VIBES : BEAN_VIBES;

  return (
    <div className="-mx-4 sm:mx-0">
      <div className="ios-shelf gap-2 px-4 sm:px-0 sm:flex-wrap py-0.5" role="group" aria-label={mode === 'cafes' ? 'Cafe filters' : 'Bean filters'}>
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
  );
};
