/** Captures the browser's install prompt so Aya can offer it at the right moment. The event can
 * fire before React mounts, so the store listens from main.tsx and the UI subscribes later. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type PromptResult = 'accepted' | 'dismissed' | 'unavailable';

export function createInstallPromptStore() {
  let deferred: BeforeInstallPromptEvent | null = null;
  let installed = false;
  let version = 0;
  const listeners = new Set<() => void>();

  const notify = () => {
    version++;
    listeners.forEach((listener) => listener());
  };

  return {
    listen(target: EventTarget): () => void {
      const onPrompt = (event: Event) => {
        event.preventDefault();
        deferred = event as BeforeInstallPromptEvent;
        notify();
      };
      const onInstalled = () => {
        installed = true;
        deferred = null;
        notify();
      };
      target.addEventListener('beforeinstallprompt', onPrompt);
      target.addEventListener('appinstalled', onInstalled);
      return () => {
        target.removeEventListener('beforeinstallprompt', onPrompt);
        target.removeEventListener('appinstalled', onInstalled);
      };
    },
    hasDeferredPrompt: (): boolean => deferred !== null,
    isInstalled: (): boolean => installed,
    async promptInstall(): Promise<PromptResult> {
      const event = deferred;
      if (!event) return 'unavailable';
      deferred = null;
      notify();
      await event.prompt();
      const { outcome } = await event.userChoice;
      return outcome;
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: (): number => version,
  };
}

export const installPrompt = createInstallPromptStore();
