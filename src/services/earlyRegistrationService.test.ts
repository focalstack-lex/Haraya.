import { describe, expect, it } from 'vitest';
import { parseEarlyRegistrationRows, parseEarlyRegistrationStatus } from './earlyRegistrationService';

describe('parseEarlyRegistrationStatus', () => {
  it('reads the slots taken and the caller position', () => {
    expect(parseEarlyRegistrationStatus({ slots: 20, claimed: 7, position: 3 })).toEqual({ slots: 20, claimed: 7, position: 3 });
  });

  it('treats a signed-out caller as having no position', () => {
    expect(parseEarlyRegistrationStatus({ slots: 20, claimed: 20, position: null })).toEqual({ slots: 20, claimed: 20, position: null });
  });

  it('rejects a reply that is not the expected shape', () => {
    expect(parseEarlyRegistrationStatus(null)).toBeNull();
    expect(parseEarlyRegistrationStatus({ slots: '20', claimed: 1 })).toBeNull();
    expect(parseEarlyRegistrationStatus({ slots: 20, claimed: 25, position: null })).toBeNull();
    expect(parseEarlyRegistrationStatus({ slots: 20, claimed: -1, position: null })).toBeNull();
    expect(parseEarlyRegistrationStatus({ slots: 20, claimed: 2, position: 0 })).toBeNull();
  });

  it('refuses a reply for a different slot count than the page offers', () => {
    expect(parseEarlyRegistrationStatus({ slots: 20, claimed: 18, position: null }, 30)).toBeNull();
    expect(parseEarlyRegistrationStatus({ slots: 30, claimed: 18, position: 4 }, 30)).toEqual({ slots: 30, claimed: 18, position: 4 });
  });
});

describe('parseEarlyRegistrationRows', () => {
  const confirmed = { place: 1, name: 'Ana', email: 'ana@gmail.com', confirmed_at: '2026-10-01T02:00:00Z', signed_up_at: '2026-10-01T01:58:00Z' };
  const waiting = { place: null, name: '', email: 'ben@gmail.com', confirmed_at: null, signed_up_at: '2026-10-01T03:00:00Z' };

  it('reads confirmed places and waiting sign-ups', () => {
    expect(parseEarlyRegistrationRows([confirmed, { ...confirmed, place: '2', email: 'cy@gmail.com' }, waiting])).toEqual([
      { place: 1, name: 'Ana', email: 'ana@gmail.com', confirmedAt: '2026-10-01T02:00:00Z', signedUpAt: '2026-10-01T01:58:00Z' },
      { place: 2, name: 'Ana', email: 'cy@gmail.com', confirmedAt: '2026-10-01T02:00:00Z', signedUpAt: '2026-10-01T01:58:00Z' },
      { place: null, name: '', email: 'ben@gmail.com', confirmedAt: null, signedUpAt: '2026-10-01T03:00:00Z' },
    ]);
  });

  it('drops malformed rows instead of showing a wrong place', () => {
    expect(parseEarlyRegistrationRows(null)).toEqual([]);
    expect(
      parseEarlyRegistrationRows([
        { ...confirmed, place: 0 },
        { ...confirmed, place: 1.5 },
        { ...confirmed, email: '' },
        { ...confirmed, confirmed_at: null },
        { ...waiting, signed_up_at: 'not a date' },
      ]),
    ).toEqual([]);
  });
});
