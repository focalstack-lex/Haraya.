import { describe, expect, it } from 'vitest';
import { isGmailAddress } from './gmailOnly';

describe('isGmailAddress', () => {
  it('accepts a Gmail address, ignoring case and surrounding spaces', () => {
    expect(isGmailAddress('aya@gmail.com')).toBe(true);
    expect(isGmailAddress('  Aya.Cafe@GMAIL.COM ')).toBe(true);
  });

  it('rejects every other domain, including look-alikes', () => {
    expect(isGmailAddress('aya@yahoo.com')).toBe(false);
    expect(isGmailAddress('aya@gmail.com.ph')).toBe(false);
    expect(isGmailAddress('aya@notgmail.com')).toBe(false);
    expect(isGmailAddress('aya@gmial.com')).toBe(false);
  });

  it('rejects text that is not an address', () => {
    expect(isGmailAddress('gmail.com')).toBe(false);
    expect(isGmailAddress('@gmail.com')).toBe(false);
    expect(isGmailAddress('')).toBe(false);
  });
});
