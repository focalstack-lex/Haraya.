import { describe, expect, it } from 'vitest';
import { createInstallPromptStore, type BeforeInstallPromptEvent } from './installPromptStore';

const makeEvent = (outcome: 'accepted' | 'dismissed' = 'accepted') => {
  const state = { prompted: 0 };
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: async () => {
      state.prompted++;
    },
    userChoice: Promise.resolve({ outcome }),
  }) as BeforeInstallPromptEvent;
  return { event, state };
};

describe('createInstallPromptStore', () => {
  it('has no prompt before any event', async () => {
    const store = createInstallPromptStore();
    store.listen(new EventTarget());
    expect(store.hasDeferredPrompt()).toBe(false);
    expect(await store.promptInstall()).toBe('unavailable');
  });

  it('captures the event and suppresses the mini-infobar', () => {
    const store = createInstallPromptStore();
    const target = new EventTarget();
    store.listen(target);
    const { event } = makeEvent();
    target.dispatchEvent(event);
    expect(store.hasDeferredPrompt()).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it('uses the prompt once then clears it', async () => {
    const store = createInstallPromptStore();
    const target = new EventTarget();
    store.listen(target);
    const { event, state } = makeEvent();
    target.dispatchEvent(event);
    expect(await store.promptInstall()).toBe('accepted');
    expect(state.prompted).toBe(1);
    expect(store.hasDeferredPrompt()).toBe(false);
    expect(await store.promptInstall()).toBe('unavailable');
  });

  it('reports a dismissed choice', async () => {
    const store = createInstallPromptStore();
    const target = new EventTarget();
    store.listen(target);
    target.dispatchEvent(makeEvent('dismissed').event);
    expect(await store.promptInstall()).toBe('dismissed');
  });

  it('marks installed on appinstalled and clears the prompt', () => {
    const store = createInstallPromptStore();
    const target = new EventTarget();
    store.listen(target);
    target.dispatchEvent(makeEvent().event);
    target.dispatchEvent(new Event('appinstalled'));
    expect(store.isInstalled()).toBe(true);
    expect(store.hasDeferredPrompt()).toBe(false);
  });

  it('notifies subscribers until unsubscribed and keeps the snapshot stable between changes', () => {
    const store = createInstallPromptStore();
    const target = new EventTarget();
    store.listen(target);
    let calls = 0;
    const unsubscribe = store.subscribe(() => calls++);
    const before = store.getSnapshot();
    expect(store.getSnapshot()).toBe(before);
    target.dispatchEvent(makeEvent().event);
    target.dispatchEvent(new Event('appinstalled'));
    expect(calls).toBe(2);
    expect(store.getSnapshot()).not.toBe(before);
    unsubscribe();
    target.dispatchEvent(makeEvent().event);
    expect(calls).toBe(2);
  });

  it('stops listening after the returned unsubscribe', () => {
    const store = createInstallPromptStore();
    const target = new EventTarget();
    const stop = store.listen(target);
    stop();
    target.dispatchEvent(makeEvent().event);
    target.dispatchEvent(new Event('appinstalled'));
    expect(store.hasDeferredPrompt()).toBe(false);
    expect(store.isInstalled()).toBe(false);
  });
});
