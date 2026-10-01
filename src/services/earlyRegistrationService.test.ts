import { describe, expect, it } from 'vitest';
import { parseEarlyRegistrationStatus } from './earlyRegistrationService';

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
});
