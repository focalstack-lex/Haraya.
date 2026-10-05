import { describe, expect, it, vi } from 'vitest';
import { CAR_ROUTER, FOOT_ROUTER, routerBase, routerCredit } from './routing';

describe('routerBase', () => {
  const fallback = 'https://routing.openstreetmap.de/routed-car';

  it('uses a configured https server, without trailing slashes', () => {
    expect(routerBase('https://osrm.haraya.space/car/', fallback)).toBe('https://osrm.haraya.space/car');
    expect(routerBase('  https://osrm.haraya.space ', fallback)).toBe('https://osrm.haraya.space');
  });

  it('allows plain http only for a server on this computer', () => {
    expect(routerBase('http://localhost:5000', fallback)).toBe('http://localhost:5000');
    expect(routerBase('http://127.0.0.1:5000/foot', fallback)).toBe('http://127.0.0.1:5000/foot');
    expect(routerBase('http://10.0.0.5:5000', fallback)).toBe(fallback);
  });

  it('falls back when unset, empty, not a web address, or carrying a query, fragment or login', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(routerBase(undefined, fallback)).toBe(fallback);
    expect(routerBase('', fallback)).toBe(fallback);
    expect(routerBase('osrm.haraya.space', fallback)).toBe(fallback);
    expect(routerBase('javascript:alert(1)', fallback)).toBe(fallback);
    expect(routerBase('https://osrm.haraya.space/car?key=abc', fallback)).toBe(fallback);
    expect(routerBase('https://osrm.haraya.space/car#x', fallback)).toBe(fallback);
    expect(routerBase('https://user:pass@osrm.haraya.space', fallback)).toBe(fallback);
    warn.mockRestore();
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
