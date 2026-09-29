import { afterEach, describe, expect, it } from 'vitest';
import { catalogService } from './catalogService';
import { CURATED_CAFES } from '../data/spots';
import { DIGOS_CAFES } from '../data/digosCafes';

const builtInCount = CURATED_CAFES.length + DIGOS_CAFES.length;

describe('catalogService.getCafes with database records', () => {
  afterEach(() => catalogService.setListedCafes([]));

  it('lists the built-in spots when the database has nothing or cannot be reached', () => {
    expect(catalogService.getCafes()).toHaveLength(builtInCount);
  });

  it('lets a stored record replace the built-in one with the same id, without listing it twice', () => {
    const stored = { ...DIGOS_CAFES[2], name: 'Renamed in the database', priceLevel: 3 as const };
    catalogService.setListedCafes([stored]);
    const cafes = catalogService.getCafes();
    expect(cafes).toHaveLength(builtInCount);
    const replaced = cafes.filter((cafe) => cafe.id === stored.id);
    expect(replaced).toHaveLength(1);
    expect(replaced[0].name).toBe('Renamed in the database');
    expect(replaced[0].priceLevel).toBe(3);
  });

  it('keeps the replaced spot in its original position', () => {
    const before = catalogService.getCafes().map((cafe) => cafe.id);
    catalogService.setListedCafes([{ ...CURATED_CAFES[0], name: 'Changed' }]);
    expect(catalogService.getCafes().map((cafe) => cafe.id)).toEqual(before);
  });

  it('still adds records the built-in list does not have', () => {
    catalogService.setListedCafes([{ ...DIGOS_CAFES[0], id: 'db-only-spot', handle: 'db-only-spot' }]);
    expect(catalogService.getCafes()).toHaveLength(builtInCount + 1);
  });
});
