import React from 'react';
import type { AmenityKey, Process, RoastLevel } from '../../types/coffee';
import { Chip } from '../common/FormControls';

export type VibeFilterId =
  | AmenityKey
  | 'singleOrigin'
  | 'heritage'
  | `process:${Process}`
  | `roast:${RoastLevel}`;

interface VibeFilterBarProps {
  mode: 'cafes' | 'beans';
  active: Set<VibeFilterId>;
  onToggle: (id: VibeFilterId) => void;
}

const CAFE_VIBES: { id: AmenityKey | 'heritage'; label: string }[] = [
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
 * Distilled Row 2 chip rail: one horizontally scrollable line of vibe and
 * brew-method toggles, edge-to-edge on phones.
 */
export const VibeFilterBar: React.FC<VibeFilterBarProps> = ({ mode, active, onToggle }) => {
  const vibes = mode === 'cafes' ? CAFE_VIBES : BEAN_VIBES;

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none py-2 -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="Vibe and method filters">
      {vibes.map((vibe) => (
        <Chip
          key={vibe.id}
          label={vibe.label}
          active={active.has(vibe.id)}
          onClick={() => onToggle(vibe.id)}
        />
      ))}
    </div>
  );
};
