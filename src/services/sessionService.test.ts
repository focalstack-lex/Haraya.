import { describe, expect, it } from 'vitest';
import { getAuthRedirectUrl } from './sessionService';

describe('getAuthRedirectUrl', () => {
  it('returns canonical production origin with trailing slash', () => {
    const url = getAuthRedirectUrl('https://www.haraya.space');
    expect(url).toBe('https://www.haraya.space/');
  });

  it('normalizes apex haraya.space to www.haraya.space/', () => {
    const url = getAuthRedirectUrl('https://haraya.space');
    expect(url).toBe('https://www.haraya.space/');
  });

  it('preserves preview domains on vercel.app', () => {
    const url = getAuthRedirectUrl('https://haraya-preview-branch.vercel.app');
    expect(url).toBe('https://haraya-preview-branch.vercel.app/');
  });

  it('keeps local development on its own origin, where the PKCE verifier is stored', () => {
    expect(getAuthRedirectUrl('http://localhost:5173')).toBe('http://localhost:5173/');
    expect(getAuthRedirectUrl('http://127.0.0.1:5173')).toBe('http://127.0.0.1:5173/');
  });

  it('avoids double trailing slashes if origin already has trailing slash', () => {
    const url = getAuthRedirectUrl('https://www.haraya.space/');
    expect(url).toBe('https://www.haraya.space/');
  });

  it('falls back to canonical production when origin is undefined or empty', () => {
    const url = getAuthRedirectUrl('');
    expect(url).toBe('https://www.haraya.space/');
  });
});
