import { describe, expect, it } from 'vitest';
import { createBackgroundUpdate } from './backgroundUpdate';

function harness() {
  let now = 0;
  const timers = new Map<number, { at: number; fn: () => void }>();
  let nextId = 1;
  let applied = 0;
  const scheduler = createBackgroundUpdate({
    delayMs: 600_000,
    apply: () => {
      applied += 1;
    },
    setTimer: (fn, ms) => {
      const id = nextId++;
      timers.set(id, { at: now + ms, fn });
      return id;
    },
    clearTimer: (id) => {
      timers.delete(id as number);
    },
  });
  const advance = (ms: number) => {
    now += ms;
    for (const [id, t] of timers) {
      if (t.at <= now) {
        timers.delete(id);
        t.fn();
      }
    }
  };
  return { scheduler, advance, timers, applied: () => applied };
}

describe('createBackgroundUpdate', () => {
  it('applies once when hidden for the full delay', () => {
    const h = harness();
    h.scheduler.onVisibility('hidden');
    h.advance(599_999);
    expect(h.applied()).toBe(0);
    h.advance(1);
    expect(h.applied()).toBe(1);
    h.advance(1_200_000);
    expect(h.applied()).toBe(1);
  });

  it('does not apply when visible again before the delay', () => {
    const h = harness();
    h.scheduler.onVisibility('hidden');
    h.advance(300_000);
    h.scheduler.onVisibility('visible');
    h.advance(1_000_000);
    expect(h.applied()).toBe(0);
  });

  it('repeated hide and show never stacks timers', () => {
    const h = harness();
    h.scheduler.onVisibility('hidden');
    h.scheduler.onVisibility('hidden');
    expect(h.timers.size).toBe(1);
    h.scheduler.onVisibility('visible');
    h.scheduler.onVisibility('hidden');
    expect(h.timers.size).toBe(1);
    h.advance(600_000);
    expect(h.applied()).toBe(1);
  });
});
