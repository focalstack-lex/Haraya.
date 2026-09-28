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

  const todayKey = localDayKey(new Date());

  // iOS Calendar week strip: weekday above, date in a circle, batch dots below
  const cell = (day: (typeof days)[number]) => {
    const selected = selectedDay === day.key;
    const isToday = day.key === todayKey;
    const count = day.drops.length;
    return (
      <button
        key={day.key}
        onClick={() => onSelectDay(selected ? null : day.key)}
        aria-pressed={selected}
        aria-label={`${day.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}, ${count} ${
          count === 1 ? 'batch' : 'batches'
        }`}
        className="shrink-0 w-11 sm:w-12 py-1.5 flex flex-col items-center gap-1 rounded-[12px] ios-press"
      >
        <span className={`text-[11px] font-medium font-sans ${isToday ? 'text-[#7D5C3D]' : 'text-[#594C3D]'}`}>
          {day.date.toLocaleDateString(undefined, { weekday: 'narrow' })}
        </span>
        <span
          className={`h-9 w-9 rounded-full flex items-center justify-center text-[17px] font-mono transition-colors ${
            selected
              ? 'bg-[#906D4B] text-[#FFFDF9] font-semibold'
              : isToday
                ? 'text-[#7D5C3D] font-semibold'
                : 'text-[#13191F] hover:bg-[#766046]/12'
          }`}
        >
          {day.date.getDate()}
        </span>
        <span className="flex gap-0.5 h-1.5" aria-hidden="true">
          {day.drops.slice(0, 3).map((drop) => (
            <span key={drop.id} className="h-1.5 w-1.5 rounded-full bg-[#906D4B]" />
          ))}
        </span>
      </button>
    );
  };

  return (
    <div className="rounded-[20px] bg-[#FFFDF9] ios-card-shadow px-1.5 sm:px-3 py-1.5">
      <div className="ios-shelf gap-0.5 sm:gap-1 sm:justify-between" role="group" aria-label="14 day roast calendar">
        {days.map(cell)}
      </div>
    </div>
  );
};
