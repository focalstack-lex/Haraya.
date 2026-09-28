import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchCafeVisits, fetchOwnVisits, insertVisitRow } from './visitService';
import {
  communityPulse,
  computePassportStats,
  describeVisitError,
  formatDuration,
  formatHours,
  inputToLocalVisit,
  isMissingTableError,
  mergeVisits,
  rowToVisit,
  timeAgo,
  toInsertRow,
  validateVisitInput,
  visitsInLastDay,
  VISIT_COLUMNS,
  type Visit,
  type VisitInput,
  type VisitRow,
} from './visitMapping';

const NOW = new Date('2026-09-29T10:00:00Z');
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();

const input = (over: Partial<VisitInput> = {}): VisitInput => ({
  cafe: { id: 'curated-green-coffee-digos', name: 'Green Coffee', city: 'Digos City' },
  sessionType: 'focus',
  durationMinutes: 95,
  drinkOrdered: '  Caramel Macchiato ',
  noiseLevel: 'quiet',
  outletsStatus: 'plenty',
  notes: '',
  isPublic: true,
  device: { lat: 6.75491234567, lng: 125.35561234567 },
  distanceMeters: 42.4567,
  ...over,
});

const row = (over: Partial<VisitRow> = {}): VisitRow => ({
  id: 'v1',
  user_id: 'u1',
  visitor_name: 'Lex',
  cafe_id: 'curated-green-coffee-digos',
  cafe_name: 'Green Coffee',
  city: 'Digos City',
  session_type: 'focus',
  duration_minutes: 120,
  drink_ordered: 'Americano',
  noise_level: 'hum',
  outlets_status: 'crowded',
  notes: 'Upstairs corner.',
  is_public: true,
  verified_distance_meters: '31.20',
  clinks_count: 3,
  created_at: hoursAgo(2),
  ...over,
});

const visit = (over: Partial<Visit> = {}): Visit => ({ ...rowToVisit(row()), ...over });

describe('validateVisitInput', () => {
  it('accepts a normal focus session', () => {
    expect(validateVisitInput(input())).toBeNull();
  });

  it('enforces the 5 minute floor and the 24 hour ceiling', () => {
    expect(validateVisitInput(input({ durationMinutes: 4 }))).toMatch(/under 5 minutes/);
    expect(validateVisitInput(input({ durationMinutes: 1441 }))).toMatch(/24 hours/);
    expect(validateVisitInput(input({ durationMinutes: 12.5 }))).toMatch(/whole minutes/);
  });

  it('keeps a Quick Stamp at exactly 30 minutes', () => {
    expect(validateVisitInput(input({ sessionType: 'stamp', durationMinutes: 30 }))).toBeNull();
    expect(validateVisitInput(input({ sessionType: 'stamp', durationMinutes: 45 }))).toMatch(/30 minutes/);
  });

  it('refuses a distance outside the 150 m database bound', () => {
    expect(validateVisitInput(input({ distanceMeters: 151 }))).toMatch(/at the spot/);
    expect(validateVisitInput(input({ distanceMeters: Number.NaN }))).toMatch(/verified/);
  });

  it('bounds the drink and notes lengths', () => {
    expect(validateVisitInput(input({ drinkOrdered: 'x'.repeat(61) }))).toMatch(/drink/);
    expect(validateVisitInput(input({ notes: 'x'.repeat(501) }))).toMatch(/notes/);
  });
});

describe('toInsertRow', () => {
  it('trims text, nulls blanks and rounds the device fix', () => {
    const payload = toInsertRow(input());
    expect(payload.drink_ordered).toBe('Caramel Macchiato');
    expect(payload.notes).toBeNull();
    expect(payload.user_lat).toBe(6.754912);
    expect(payload.user_lng).toBe(125.355612);
    expect(payload.verified_distance_meters).toBe(42.46);
  });

  it('never sends server-set fields', () => {
    const payload = toInsertRow(input()) as Record<string, unknown>;
    for (const key of ['user_id', 'visitor_name', 'clinks_count', 'created_at', 'id']) {
      expect(payload).not.toHaveProperty(key);
    }
  });
});

describe('rowToVisit and local visits', () => {
  it('maps database rows, including numeric strings', () => {
    const mapped = rowToVisit(row());
    expect(mapped).toMatchObject({ id: 'v1', userId: 'u1', durationMinutes: 120, distanceMeters: 31.2, synced: true });
  });

  it('names an unnamed author', () => {
    expect(rowToVisit(row({ visitor_name: '' })).visitorName).toBe('Haraya scout');
  });

  it('builds an unsynced device visit from the input', () => {
    const local = inputToLocalVisit(input(), 'local-1', null, 'You', NOW);
    expect(local).toMatchObject({ id: 'local-1', userId: null, synced: false, clinksCount: 0, createdAt: NOW.toISOString() });
  });
});

describe('ledger summaries', () => {
  it('merges device and database copies, database first, newest first', () => {
    const local = [visit({ id: 'a', createdAt: hoursAgo(5), notes: 'device copy' }), visit({ id: 'b', createdAt: hoursAgo(1) })];
    const remote = [visit({ id: 'a', createdAt: hoursAgo(5), notes: 'database copy' })];
    const merged = mergeVisits(local, remote);
    expect(merged.map((v) => v.id)).toEqual(['b', 'a']);
    expect(merged[1].notes).toBe('database copy');
  });

  it('counts the rolling 24 hour window the rate limit uses', () => {
    const visits = [visit({ createdAt: hoursAgo(1) }), visit({ createdAt: hoursAgo(23.9) }), visit({ createdAt: hoursAgo(24.1) })];
    expect(visitsInLastDay(visits, NOW)).toBe(2);
  });

  it('totals focus minutes, clinks and first stamp dates', () => {
    const stats = computePassportStats([
      visit({ id: 'a', durationMinutes: 90, clinksCount: 2, createdAt: hoursAgo(1) }),
      visit({ id: 'b', durationMinutes: 30, clinksCount: 1, createdAt: hoursAgo(48) }),
      visit({ id: 'c', cafeId: 'other', durationMinutes: 45, clinksCount: 0, createdAt: hoursAgo(3) }),
    ]);
    expect(stats.focusMinutes).toBe(165);
    expect(stats.clinksReceived).toBe(3);
    expect(stats.stamps.size).toBe(2);
    expect(stats.stamps.get('curated-green-coffee-digos')).toBe(hoursAgo(48));
  });

  it('reports the most common recent noise level', () => {
    const pulse = communityPulse(
      [
        visit({ noiseLevel: 'quiet', createdAt: hoursAgo(2) }),
        visit({ noiseLevel: 'buzzing', createdAt: hoursAgo(1) }),
        visit({ noiseLevel: 'quiet', createdAt: hoursAgo(5) }),
        visit({ noiseLevel: 'buzzing', createdAt: hoursAgo(30) }),
        visit({ noiseLevel: null, createdAt: hoursAgo(1) }),
      ],
      NOW
    );
    expect(pulse).toEqual({ noise: 'quiet', reports: 2, latestAt: hoursAgo(2) });
  });

  it('breaks a tie toward the most recent report and ignores old ones', () => {
    const pulse = communityPulse([visit({ noiseLevel: 'hum', createdAt: hoursAgo(3) }), visit({ noiseLevel: 'quiet', createdAt: hoursAgo(1) })], NOW);
    expect(pulse?.noise).toBe('quiet');
    expect(communityPulse([visit({ noiseLevel: 'quiet', createdAt: hoursAgo(25) })], NOW)).toBeNull();
  });
});

describe('formatting', () => {
  it('formats durations and hours', () => {
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(135)).toBe('2h 15m');
    expect(formatHours(0)).toBe('0');
    expect(formatHours(2310)).toBe('38.5');
  });

  it('describes time since a visit', () => {
    expect(timeAgo(NOW.toISOString(), NOW)).toBe('just now');
    expect(timeAgo(hoursAgo(0.25), NOW)).toBe('15 min ago');
    expect(timeAgo(hoursAgo(2), NOW)).toBe('2 hours ago');
    expect(timeAgo(hoursAgo(30), NOW)).toBe('yesterday');
  });

  it('recognizes an unapplied migration and friendly-names trigger errors', () => {
    expect(isMissingTableError({ code: 'PGRST205', message: '' })).toBe(true);
    expect(isMissingTableError({ code: '23514', message: 'violates check constraint' })).toBe(false);
    expect(describeVisitError('visit_limit: You can log up to 6 visits a day')).toMatch(/6 visits/);
  });
});

/**
 * Records every builder call so the query shape can be asserted without a network. The chain's last call
 * (limit for reads, single for the insert) resolves with the canned result, as the real builder does.
 */
function stubClient(result: unknown) {
  const calls: [string, unknown[]][] = [];
  const builder: Record<string, unknown> = {};
  for (const method of ['from', 'select', 'eq', 'order', 'insert', 'in']) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, args]);
      return builder;
    };
  }
  for (const terminal of ['limit', 'single']) {
    builder[terminal] = (...args: unknown[]) => {
      calls.push([terminal, args]);
      return Promise.resolve(result);
    };
  }
  return { client: builder as unknown as SupabaseClient, calls };
}

describe('query helpers', () => {
  it('never selects device coordinates', () => {
    expect(VISIT_COLUMNS).not.toMatch(/user_lat|user_lng/);
  });

  it('loads a cafe feed of public visits only, newest first, capped', async () => {
    const { client, calls } = stubClient({ data: [row()], error: null });
    const result = await fetchCafeVisits(client, 'curated-green-coffee-digos');
    expect(result).toEqual({ data: [row()], error: null });
    expect(calls).toEqual([
      ['from', ['sanctuary_visits']],
      ['select', [VISIT_COLUMNS]],
      ['eq', ['cafe_id', 'curated-green-coffee-digos']],
      ['eq', ['is_public', true]],
      ['order', ['created_at', { ascending: false }]],
      ['limit', [20]],
    ]);
  });

  it('loads the account ledger by user id', async () => {
    const { client, calls } = stubClient({ data: [], error: null });
    await fetchOwnVisits(client, 'u1');
    expect(calls).toContainEqual(['eq', ['user_id', 'u1']]);
  });

  it('inserts the mapped row and reads it back without coordinates', async () => {
    const { client, calls } = stubClient({ data: row(), error: null });
    const payload = toInsertRow(input());
    await insertVisitRow(client, payload);
    expect(calls).toEqual([
      ['from', ['sanctuary_visits']],
      ['insert', [payload]],
      ['select', [VISIT_COLUMNS]],
      ['single', []],
    ]);
  });
});
