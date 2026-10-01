import { describe, expect, it } from 'vitest';
import {
  elapsedMinutes,
  elapsedSeconds,
  EXIT_FIXES,
  formatClock,
  nextOutsideCount,
  parseActiveSession,
  sessionToVisitInput,
  type ActiveFocusSession,
} from './useFocusSession';

const session: ActiveFocusSession = {
  cafeId: 'curated-green-coffee-digos',
  cafeName: 'Green Coffee',
  city: 'Digos City',
  cafeCoordinates: [6.7548589, 125.3555501],
  startedAt: '2026-09-29T08:00:00.000Z',
  userStartCoordinates: [6.7549, 125.3556],
  startDistanceMeters: 12.3,
};
const start = Date.parse(session.startedAt);

describe('stored session', () => {
  it('round-trips a valid session', () => {
    expect(parseActiveSession(JSON.stringify(session))).toEqual(session);
  });

  it('treats missing, corrupt or partial entries as no session', () => {
    expect(parseActiveSession(null)).toBeNull();
    expect(parseActiveSession('{not json')).toBeNull();
    expect(parseActiveSession(JSON.stringify({ ...session, cafeCoordinates: [6.75] }))).toBeNull();
    expect(parseActiveSession(JSON.stringify({ ...session, startedAt: 'yesterday' }))).toBeNull();
  });
});

describe('timer', () => {
  it('rounds elapsed minutes as the spec does', () => {
    expect(elapsedMinutes(session.startedAt, start + 89_000)).toBe(1);
    expect(elapsedMinutes(session.startedAt, start + 135 * 60_000 + 20_000)).toBe(135);
    expect(elapsedMinutes(session.startedAt, start - 5_000)).toBe(0);
  });

  it('formats a live HH:MM:SS clock', () => {
    expect(formatClock(elapsedSeconds(session.startedAt, start + 3_723_000))).toBe('01:02:03');
    expect(formatClock(0)).toBe('00:00:00');
  });
});

describe('boundary exit', () => {
  it('needs two fixes in a row beyond 150 m', () => {
    let outside = 0;
    for (const distance of [40, 180, 60, 170]) outside = nextOutsideCount(outside, distance);
    expect(outside).toBe(1);
    outside = nextOutsideCount(outside, 400);
    expect(outside).toBe(EXIT_FIXES);
  });

  it('treats exactly 150 m as still inside', () => {
    expect(nextOutsideCount(1, 150)).toBe(0);
  });

  it('does not let a wide indoor fix end a session, nor reset the count', () => {
    // A Wi-Fi or cell fix 900 m wide that lands 400 m away
    expect(nextOutsideCount(0, 400, 900)).toBe(0);
    expect(nextOutsideCount(1, 400, 900)).toBe(1);
    expect(nextOutsideCount(1, 400, 25)).toBe(EXIT_FIXES);
    // Back inside resets, however wide
    expect(nextOutsideCount(1, 60, 900)).toBe(0);
  });

  it('counts a missing radius as too wide to tell', () => {
    expect(nextOutsideCount(1, 400, Number.NaN)).toBe(1);
  });
});

describe('sessionToVisitInput', () => {
  it('reports the verified check-in fix, not the exit position, and caps at 24 hours', () => {
    const visit = sessionToVisitInput(session, 2000, { isPublic: false });
    expect(visit).toMatchObject({
      sessionType: 'focus',
      durationMinutes: 1440,
      device: { lat: 6.7549, lng: 125.3556 },
      distanceMeters: 12.3,
      isPublic: false,
    });
  });
});
