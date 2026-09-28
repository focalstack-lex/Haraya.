import type { Cafe, WeeklyHours } from '../../types/coffee';

/** What a visitor is looking for; replaces the old Cafes / Beans / Following modes. */
export type SpotCategory = 'all' | 'study' | 'quiet' | 'late';

export const SPOT_CATEGORIES: { id: SpotCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'study', label: 'Study & Work' },
  { id: 'quiet', label: 'Quiet' },
  { id: 'late', label: 'Open Late' },
];

/** "Open late" means open at or after this time on at least one day. */
export const LATE_CUTOFF_MINUTES = 21 * 60;

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/** True when any listed day closes at 9 PM or later, or runs past midnight. */
export function closesLate(hours: WeeklyHours): boolean {
  return Object.values(hours).some((day) => {
    if (!day.open || !day.close) return false;
    const open = toMinutes(day.open);
    const close = toMinutes(day.close);
    return close <= open || close >= LATE_CUTOFF_MINUTES;
  });
}

/** Study & Work: plugs and fast Wi-Fi together, or a venue that lists itself as work-friendly. */
export const isStudySpot = (cafe: Cafe) =>
  (cafe.amenities.includes('plugs') && cafe.amenities.includes('fastWifi')) || cafe.amenities.includes('workFriendly');

export const isQuietCorner = (cafe: Cafe) => cafe.amenities.includes('quietFocus');

export const isOpenLate = (cafe: Cafe) => cafe.amenities.includes('lateNight') || closesLate(cafe.hours);

export function matchesCategory(cafe: Cafe, category: SpotCategory): boolean {
  switch (category) {
    case 'study':
      return isStudySpot(cafe);
    case 'quiet':
      return isQuietCorner(cafe);
    case 'late':
      return isOpenLate(cafe);
    default:
      return true;
  }
}
