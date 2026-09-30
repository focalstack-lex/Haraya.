import { describe, expect, it } from 'vitest';
import { clusterByPixels, photoPinHtml, photoStackHtml, pinStatus, spotPhoto } from './mapPins';
import type { WeeklyHours } from '../../types/coffee';

const allWeek = (open: string | null, close: string | null): WeeklyHours => ({
  Monday: { open, close },
  Tuesday: { open, close },
  Wednesday: { open, close },
  Thursday: { open, close },
  Friday: { open, close },
  Saturday: { open, close },
  Sunday: { open, close },
});

// A Wednesday
const at = (time: string) => new Date(`2026-09-30T${time}:00`);

describe('pinStatus', () => {
  it('is open inside the listed hours and closed outside them', () => {
    expect(pinStatus(allWeek('08:00', '18:00'), at('10:00'))).toBe('open');
    expect(pinStatus(allWeek('08:00', '18:00'), at('19:30'))).toBe('closed');
  });

  it('is unknown when no hours are listed', () => {
    expect(pinStatus(allWeek(null, null), at('10:00'))).toBe('unknown');
  });
});

describe('clusterByPixels', () => {
  const point = (id: string, x: number, y: number) => ({ id, x, y });
  const ids = (clusters: { members: { id: string }[] }[]) => clusters.map((cluster) => cluster.members.map((m) => m.id));

  it('merges points closer than the radius and keeps far ones apart', () => {
    const clusters = clusterByPixels([point('a', 0, 0), point('b', 10, 0), point('c', 200, 0)], (p) => p, 36);
    expect(ids(clusters)).toEqual([['a', 'b'], ['c']]);
    expect(clusters[0].center).toEqual({ x: 5, y: 0 });
  });

  it('leaves every point alone with a zero radius, even on the same pixel', () => {
    const clusters = clusterByPixels([point('a', 0, 0), point('b', 0, 0)], (p) => p, 0);
    expect(ids(clusters)).toEqual([['a'], ['b']]);
  });

  it('keeps the input order inside a cluster', () => {
    const clusters = clusterByPixels([point('z', 5, 5), point('y', 0, 0), point('x', 3, 3)], (p) => p, 36);
    expect(ids(clusters)).toEqual([['z', 'y', 'x']]);
  });

  it('handles no points', () => {
    expect(clusterByPixels([], (p: { x: number; y: number }) => p, 36)).toEqual([]);
  });
});

describe('photo pins', () => {
  it('uses the logo, then the first photo', () => {
    expect(spotPhoto({ logoUrl: '/logo.webp', images: ['/a.webp'] })).toBe('/logo.webp');
    expect(spotPhoto({ logoUrl: '', images: ['/a.webp'] })).toBe('/a.webp');
    expect(spotPhoto({ logoUrl: '', images: [] })).toBe('');
  });

  it('escapes the photo address inside the marker HTML', () => {
    expect(photoPinHtml('/x".webp')).toContain('src="/x&quot;.webp"');
  });

  it('stacks at most three photos and sizes the group to them', () => {
    const stack = photoStackHtml(['/a', '/b', '/c', '/d']);
    expect(stack.html.match(/<img/g)).toHaveLength(3);
    expect(stack.width).toBe(34 + 2 * 16);
    expect(photoStackHtml(['/a', '/b']).width).toBe(34 + 16);
  });
});
