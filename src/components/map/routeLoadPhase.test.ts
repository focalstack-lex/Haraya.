import { describe, expect, it } from 'vitest';
import { routeLoadPhase } from './routeLoadPhase';

describe('routeLoadPhase', () => {
  it('is off without a destination', () => {
    expect(routeLoadPhase(false, 'locating', false, 'idle')).toBeNull();
  });

  it('waits for the GPS fix first', () => {
    expect(routeLoadPhase(true, 'idle', false, 'idle')).toBe('locating');
    expect(routeLoadPhase(true, 'locating', false, 'idle')).toBe('locating');
    expect(routeLoadPhase(true, 'active', false, 'idle')).toBe('locating');
  });

  it('then waits for the street route', () => {
    expect(routeLoadPhase(true, 'active', true, 'idle')).toBe('routing');
    expect(routeLoadPhase(true, 'active', true, 'loading')).toBe('routing');
  });

  it('ends when the route arrives', () => {
    expect(routeLoadPhase(true, 'active', true, 'ready')).toBeNull();
  });

  it('ends when the route fails, so the straight-line guide can show', () => {
    expect(routeLoadPhase(true, 'active', true, 'failed')).toBeNull();
  });

  it('never covers arrival or a location problem', () => {
    expect(routeLoadPhase(true, 'arrived', true, 'loading')).toBeNull();
    expect(routeLoadPhase(true, 'denied', false, 'idle')).toBeNull();
    expect(routeLoadPhase(true, 'unavailable', false, 'idle')).toBeNull();
  });
});
