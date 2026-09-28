import { describe, expect, it } from 'vitest';
import { isLateEvening, moodCardState } from './MoodCard';

const at = (hour: number, minute = 0) => new Date(2026, 8, 29, hour, minute);

describe('isLateEvening', () => {
  it('runs from 8 PM to just before 4 AM', () => {
    expect(isLateEvening(at(19, 59))).toBe(false);
    expect(isLateEvening(at(20))).toBe(true);
    expect(isLateEvening(at(0, 30))).toBe(true);
    expect(isLateEvening(at(3, 59))).toBe(true);
    expect(isLateEvening(at(4))).toBe(false);
    expect(isLateEvening(at(12))).toBe(false);
  });
});

describe('moodCardState', () => {
  it('lets a running focus session win over everything', () => {
    expect(moodCardState(true, true, true)).toBe('focus');
  });

  it('prefers late evening over an empty passport', () => {
    expect(moodCardState(false, true, true)).toBe('late');
  });

  it('invites a first check-in when the passport is empty', () => {
    expect(moodCardState(false, false, true)).toBe('first');
  });

  it('falls back to the mood question', () => {
    expect(moodCardState(false, false, false)).toBe('default');
  });
});
