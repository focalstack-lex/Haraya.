import { describe, expect, it } from 'vitest';
import { interpretRequest, parseQuery } from './parseQuery';

describe('parseQuery', () => {
  it('reads a study request with needs', () => {
    const result = parseQuery('quiet place to study with wifi');
    expect(result.mood).toBe('focused');
    expect(result.mustHaves).toEqual(expect.arrayContaining(['quiet', 'wifi']));
  });

  it('reads pets and a district', () => {
    const result = parseQuery('coffee with my dog near Matina');
    expect(result.mustHaves).toContain('pets');
    expect(result.district).toBe('Matina');
  });

  it('reads a budget hangout with friends', () => {
    const result = parseQuery('cheap cup with the barkada');
    expect(result.mood).toBe('social');
    expect(result.maxPrice).toBe(1);
  });

  it('treats "not too pricey" as mid price, not budget', () => {
    expect(parseQuery('not too pricey please').maxPrice).toBe(2);
  });

  it('is case-insensitive', () => {
    expect(parseQuery('Quick Coffee before work').mood).toBe('quick');
  });

  it('matches whole words only', () => {
    expect(parseQuery('a study session').mood).toBe('focused');
    expect(parseQuery('I love dogma').mustHaves ?? []).not.toContain('pets');
  });

  it('reads open now and air-con', () => {
    const result = parseQuery('somewhere open now with aircon');
    expect(result.mustHaves).toEqual(expect.arrayContaining(['openNow', 'aircon']));
  });

  it('returns nothing for empty or unrelated text', () => {
    expect(parseQuery('')).toEqual({});
    expect(parseQuery('hello there')).toEqual({});
  });

  it('interpretRequest resolves to the same result', async () => {
    await expect(interpretRequest('study with wifi')).resolves.toEqual(parseQuery('study with wifi'));
  });
});
