import React, { useMemo } from 'react';
import type { RoastDrop } from '../../types/coffee';
import { localDayKey } from '../../utils/calendar';

interface DropCalendarStripProps {
  drops: RoastDrop[];
  selectedDay: string | null;
  onSelectDay: (dayKey: string | null) => void;
}

/**
 * 14-day horizontal calendar of roast batches. Each cell shows the weekday,
 * the date, and a dot per drop that day; selecting a day filters the vault.
 */
export const DropCalendarStrip: React.FC<DropCalendarStripProps> = ({ drops, selectedDay, onSelectDay }) => {
  const days = useMemo(() => {
    const byDay = new Map<string, RoastDrop[]>();
    for (const drop of drops) {
      const key = localDayKey(new Date(drop.dropAt));
      const bucket = byDay.get(key) ?? [];
      bucket.push(drop);
      byDay.set(key, bucket);
    }
    return Array.from({ length: 14 }, (_, offset) => {
      const date = new Date(Date.now() + offset * 86_400_000);
      const key = localDayKey(date);
      return { key, date, drops: byDay.get(key) ?? [] };
    });
  }, [drops]);

  const cell = (day: (typeof days)[number]) => {
    const selected = selectedDay === day.key;
    const isToday = day.key === localDayKey(new Date());
    return (
      <button
        key={day.key}
        onClick={() => onSelectDay(selected ? null : day.key)}
        aria-pressed={selected}
        className={`h-20 sm:h-24 shrink-0 w-16 sm:w-20 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-colors ${
          selected
            ? 'bg-[#1A2225] border-[#1A2225] text-[#FFF9E9]'
            : 'bg-[#FFF9E9] border-[#E6DCC0] text-[#1A2225] hover:border-[#1A2225]/40'
        }`}
      >
        <span className={`text-[9px] font-bold uppercase tracking-widest font-sans ${selected ? 'text-[#FFF9E9]/70' : 'text-[#55615D]'}`}>
          {day.date.toLocaleDateString(undefined, { weekday: 'short' })}
        </span>
        <span className={`font-cooper text-lg sm:text-xl font-bold ${isToday && !selected ? 'text-[#C86428]' : ''}`}>
          {day.date.getDate()}
        </span>
        <span className="flex gap-1 h-1.5">
          {day.drops.slice(0, 3).map((drop) => (
            <span key={drop.id} className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-[#C86428]' : 'bg-[#1A2225]'}`} />
          ))}
        </span>
      </button>
    );
  };

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none py-1 -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="14 day roast calendar">
      {days.map(cell)}
    </div>
  );
};
