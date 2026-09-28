import { describe, expect, it } from 'vitest';
import { minutesUntilClose } from './calendar';
import type { WeeklyHours } from '../types/coffee';

const week = (open: string | null, close: string | null): WeeklyHours => ({
  Monday: { open, close },
  Tuesday: { open, close },
  Wednesday: { open, close },
  Thursday: { open, close },
  Friday: { open, close },
  Saturday: { open, close },
  Sunday: { open, close },
});

// 2026-09-28 is a Monday
const at = (hh: number, mm: number, day = 28) => new Date(2026, 8, day, hh, mm);

describe('minutesUntilClose', () => {
  it('counts minutes left in a same-day window', () => {
    expect(minutesUntilClose(week('07:00', '22:00'), at(20, 30))).toBe(90);
  });

  it('is 0 before opening and after closing', () => {
    expect(minutesUntilClose(week('07:00', '22:00'), at(6, 0))).toBe(0);
    expect(minutesUntilClose(week('07:00', '22:00'), at(22, 0))).toBe(0);
  });

  it('is 0 on a closed day', () => {
    expect(minutesUntilClose(week(null, null), at(12, 0))).toBe(0);
  });

  it('runs past midnight for overnight windows', () => {
    expect(minutesUntilClose(week('18:00', '01:00'), at(23, 0))).toBe(120);
  });

  it('counts the previous day window after midnight', () => {
    expect(minutesUntilClose(week('18:00', '01:00'), at(0, 30, 29))).toBe(30);
  });
});
