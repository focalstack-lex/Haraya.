import { useSyncExternalStore } from 'react';

const subscribe = (notify: () => void) => {
  window.addEventListener('online', notify);
  window.addEventListener('offline', notify);
  return () => {
    window.removeEventListener('online', notify);
    window.removeEventListener('offline', notify);
  };
};

const getOnline = () => navigator.onLine;
const getServerOnline = () => true;

/** True while the browser reports a network connection; re-renders when it drops or comes back. */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, getOnline, getServerOnline);
}
