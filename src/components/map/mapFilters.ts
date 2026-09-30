import type { Cafe } from '../../types/coffee';
import { isOpenNow } from '../../utils/calendar';
import { isQuietCorner } from '../feed/spotCategories';

export type MapFilterId = 'openNow' | 'wifi' | 'plugs' | 'quiet';

export const MAP_FILTERS: { id: MapFilterId; label: string }[] = [
  { id: 'openNow', label: 'Open now' },
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'plugs', label: 'Plugs' },
  { id: 'quiet', label: 'Quiet' },
];

function matchesOne(cafe: Cafe, filter: MapFilterId, now: Date): boolean {
  switch (filter) {
    case 'openNow':
      // A spot without listed hours cannot promise it is open
      return isOpenNow(cafe.hours, now);
    case 'wifi':
      return cafe.amenities.includes('fastWifi');
    case 'plugs':
      return cafe.amenities.includes('plugs');
    case 'quiet':
      return isQuietCorner(cafe);
  }
}

/** True when the spot passes every active map filter; no filters means every spot. */
export function matchesMapFilters(cafe: Cafe, active: ReadonlySet<MapFilterId>, now: Date = new Date()): boolean {
  for (const filter of active) if (!matchesOne(cafe, filter, now)) return false;
  return true;
}
