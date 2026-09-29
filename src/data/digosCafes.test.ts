import { describe, expect, it } from 'vitest';
import { DIGOS_CAFES } from './digosCafes';
import { hasListedHours, isOpenNow, minutesUntilClose } from '../utils/calendar';

const byName = (name: string) => {
  const cafe = DIGOS_CAFES.find((entry) => entry.name === name);
  if (!cafe) throw new Error(`missing ${name}`);
  return cafe;
};
// 2026-09-28 is a Monday; 2026-09-27 a Sunday
const at = (day: number, hh: number, mm = 0) => new Date(2026, 8, day, hh, mm);

describe('Digos cafes', () => {
  it('lists every spot once, in Digos City, with a photo path and a pin inside the city', () => {
    const ids = DIGOS_CAFES.map((cafe) => cafe.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const cafe of DIGOS_CAFES) {
      expect(cafe.city).toBe('Digos City');
      expect(cafe.images[0]).toMatch(/^\/(spots|placeholders)\//);
      expect(cafe.lat).toBeGreaterThan(6.68);
      expect(cafe.lat).toBeLessThan(6.83);
      expect(cafe.lng).toBeGreaterThan(125.28);
      expect(cafe.lng).toBeLessThan(125.43);
    }
  });

  it('only carries well-formed times, and every listed day has both an open and a close', () => {
    for (const cafe of DIGOS_CAFES) {
      for (const day of Object.values(cafe.hours)) {
        expect(Boolean(day.open)).toBe(Boolean(day.close));
        if (day.open && day.close) {
          expect(day.open).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
          expect(day.close).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
        }
      }
    }
  });

  it('leaves the hours empty for shops with no source', () => {
    for (const name of ["Lil' Ben Coffee House", "Cely's Cafe", 'Infinitea', 'Cool Brews']) {
      expect(hasListedHours(byName(name).hours)).toBe(false);
    }
  });

  it('follows the listed hours, including the Friday and Saturday split at Café Vicente', () => {
    const vicente = byName('Café Vicente');
    expect(isOpenNow(vicente.hours, at(28, 19, 30))).toBe(true); // Monday 7:30 PM
    expect(isOpenNow(vicente.hours, at(28, 20, 30))).toBe(false); // closed at 8 PM on a Monday
    expect(isOpenNow(vicente.hours, at(25, 20, 30))).toBe(true); // Friday 8:30 PM, open until 9
    expect(isOpenNow(vicente.hours, at(25, 8, 45))).toBe(true); // Friday opens at 8:30
  });

  it('runs Kaffeeneology past midnight and opens it late on Sundays', () => {
    const kaffeeneology = byName('Kaffeeneology');
    expect(isOpenNow(kaffeeneology.hours, at(27, 0, 30))).toBe(true); // Saturday night, 12:30 AM Sunday
    expect(minutesUntilClose(kaffeeneology.hours, at(26, 23, 30))).toBe(90);
    expect(isOpenNow(kaffeeneology.hours, at(27, 11, 0))).toBe(false); // Sunday opens at 1 PM
    expect(isOpenNow(kaffeeneology.hours, at(27, 13, 0))).toBe(true);
  });

  it('opens The Nook late on Sundays and G&Co. every day', () => {
    expect(isOpenNow(byName('The Nook').hours, at(27, 12, 0))).toBe(false);
    expect(isOpenNow(byName('The Nook').hours, at(27, 22, 30))).toBe(false);
    expect(isOpenNow(byName('G&Co. Cafe').hours, at(27, 21, 59))).toBe(true);
  });
});
