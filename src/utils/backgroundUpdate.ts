interface BackgroundUpdateOptions {
  /** How long the page must stay hidden before the waiting update is applied */
  delayMs: number;
  apply: () => void;
  setTimer: (fn: () => void, ms: number) => unknown;
  clearTimer: (id: unknown) => void;
}

/**
 * Applies a waiting service worker update only after the page has been hidden for a while, so a quick
 * tab switch never reloads the app mid-form. At most one timer is ever pending.
 */
export function createBackgroundUpdate({ delayMs, apply, setTimer, clearTimer }: BackgroundUpdateOptions) {
  let timer: unknown = null;
  const clear = () => {
    if (timer !== null) clearTimer(timer);
    timer = null;
  };
  return {
    onVisibility(state: DocumentVisibilityState) {
      clear();
      if (state !== 'hidden') return;
      timer = setTimer(() => {
        timer = null;
        apply();
      }, delayMs);
    },
  };
}
