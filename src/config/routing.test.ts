import { describe, expect, it } from 'vitest';
import { CAR_ROUTER, FOOT_ROUTER, routerBase, routerCredit } from './routing';

describe('routerBase', () => {
  const fallback = 'https://routing.openstreetmap.de/routed-car';

  it('uses a configured server, without trailing slashes', () => {
    expect(routerBase('https://osrm.haraya.space/car/', fallback)).toBe('https://osrm.haraya.space/car');
    expect(routerBase('  http://10.0.0.5:5000 ', fallback)).toBe('http://10.0.0.5:5000');
  });

  it('falls back when unset, empty or not a web address', () => {
    expect(routerBase(undefined, fallback)).toBe(fallback);
    expect(routerBase('', fallback)).toBe(fallback);
    expect(routerBase('osrm.haraya.space', fallback)).toBe(fallback);
    expect(routerBase('javascript:alert(1)', fallback)).toBe(fallback);
  });
});

describe('routerCredit', () => {
  it('names FOSSGIS only for its own servers', () => {
    expect(routerCredit('https://routing.openstreetmap.de/routed-foot')).toBe('OSRM/FOSSGIS');
    expect(routerCredit('https://routing.openstreetmap.de.evil.example/x')).toBe('OSRM');
    expect(routerCredit('https://osrm.haraya.space')).toBe('OSRM');
  });
});

describe('defaults', () => {
  it('point at the FOSSGIS foot and car servers when nothing is configured', () => {
    expect(FOOT_ROUTER).toBe('https://routing.openstreetmap.de/routed-foot');
    expect(CAR_ROUTER).toBe('https://routing.openstreetmap.de/routed-car');
  });
});
