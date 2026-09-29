import React, { useSyncExternalStore } from 'react';
import { AyaMascot } from '../common/AyaMascot';

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

export const OfflineNotice: React.FC = () => {
  const online = useSyncExternalStore(subscribe, getOnline, getServerOnline);
  if (online) return null;

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-3">
      <div role="status" className="flex items-center gap-3 bg-surface rounded-row p-3">
        <AyaMascot pose="empty" size={48} alt="" />
        <p className="text-[14px] leading-snug text-ink-2">
          You're offline. I'll bring the spots back once you're connected.
        </p>
      </div>
    </div>
  );
};
