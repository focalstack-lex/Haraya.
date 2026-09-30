import React from 'react';
import { AyaMascot } from '../common/AyaMascot';
import { useOnline } from '../../hooks/useOnline';

export const OfflineNotice: React.FC = () => {
  const online = useOnline();
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
