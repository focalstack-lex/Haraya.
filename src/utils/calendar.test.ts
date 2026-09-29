import { describe, expect, it } from 'vitest';
import { isOpenNow, minutesUntilClose } from './calendar';
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

describe('isOpenNow', () => {
  it('is open inside a same-day window and closed outside it', () => {
    expect(isOpenNow(week('07:00', '22:00'), at(20, 30))).toBe(true);
    expect(isOpenNow(week('07:00', '22:00'), at(22, 0))).toBe(false);
  });

  it('stays open through the evening of a window that closes after midnight', () => {
    expect(isOpenNow(week('18:00', '01:00'), at(20, 0))).toBe(true);
    expect(isOpenNow(week('07:00', '00:00'), at(23, 30))).toBe(true);
  });

  it('counts the part after midnight against the previous day', () => {
    expect(isOpenNow(week('18:00', '01:00'), at(0, 30, 29))).toBe(true);
    expect(isOpenNow(week('18:00', '01:00'), at(1, 0, 29))).toBe(false);
  });
});
