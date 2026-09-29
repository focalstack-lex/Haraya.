import { describe, expect, it } from 'vitest';
import { inboxFor } from './inbox';

describe('inboxFor', () => {
  it('sends Gmail addresses to Gmail, whatever the case', () => {
    expect(inboxFor('Someone@Gmail.com')).toEqual({ name: 'Gmail', url: 'https://mail.google.com/' });
    expect(inboxFor(' someone@googlemail.com ')?.name).toBe('Gmail');
  });

  it('knows the other common inboxes', () => {
    expect(inboxFor('a@hotmail.com')?.name).toBe('Outlook');
    expect(inboxFor('a@yahoo.com')?.name).toBe('Yahoo Mail');
  });

  it('gives no link for an unknown or malformed address', () => {
    expect(inboxFor('a@school.edu.ph')).toBeNull();
    expect(inboxFor('not-an-email')).toBeNull();
    expect(inboxFor('')).toBeNull();
  });
});
