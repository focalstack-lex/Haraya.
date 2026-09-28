import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';

/** Live countdown digits (DD:HH:MM:SS) that tick once per second. */
export const DropCountdownTimer: React.FC<{ dropAt: string; compact?: boolean }> = ({ dropAt, compact = false }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const target = new Date(dropAt).getTime();
  const remaining = Math.max(0, target - now);

  if (target <= now) {
    // Live: a small semantic dot plus text, like an iOS status row
    return (
      <span className={`inline-flex items-center gap-1.5 ${compact ? 'text-[11px]' : 'text-[12px]'} font-medium font-sans text-[#3E5C48]`}>
        <span className="h-1.5 w-1.5 rounded-full bg-[#3E5C48] animate-status-pulse" aria-hidden="true" />
        Batch is live on the shelf
      </span>
    );
  }

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);

  const pad = (value: number) => String(value).padStart(2, '0');
  const text = `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return (
    <span
      className={`tabular-countdown inline-flex items-center gap-1 ${compact ? 'text-[11px]' : 'text-[13px]'} font-semibold font-mono text-[#7D5C3D]`}
      aria-label={`Drops in ${days} days, ${hours} hours, ${minutes} minutes`}
    >
      <Timer className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />
      {text}
    </span>
  );
};
