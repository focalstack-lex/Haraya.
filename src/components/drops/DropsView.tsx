import React, { useMemo, useState } from 'react';
import { Flame, Vault } from 'lucide-react';
import type { RoastDrop } from '../../types/coffee';
import { catalogService } from '../../services/catalogService';
import { localDayKey } from '../../utils/calendar';
import { DropCalendarStrip } from '../drops/DropCalendarStrip';
import { BeanDropCard } from '../drops/BeanDropCard';

interface DropsViewProps {
  drops: RoastDrop[];
  onInspectBean: (beanId: string) => void;
}

/** Bean Drops: 14-day roast calendar on top, micro-lot vault under it. */
export const DropsView: React.FC<DropsViewProps> = ({ drops, onInspectBean }) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const beansById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof catalogService.getBeanById>>();
    for (const drop of drops) map.set(drop.beanId, catalogService.getBeanById(drop.beanId));
    return map;
  }, [drops]);

  const limited = useMemo(
    () => drops.filter((drop) => beansById.get(drop.beanId)?.isLimited),
    [drops, beansById]
  );

  const visibleDrops = useMemo(() => {
    if (!selectedDay) return drops;
    return drops.filter((drop) => localDayKey(new Date(drop.dropAt)) === selectedDay);
  }, [drops, selectedDay]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      <div className="relative overflow-hidden bg-[#1A2225] text-[#FFF9E9] p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-xl space-y-2">
        <h1 className="font-cooper text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
          Roast Drop Calendar
        </h1>
        <p className="text-xs sm:text-sm lg:text-base text-[#FFF9E9]/75 max-w-2xl font-sans leading-relaxed">
          Fourteen days of fresh batches across the Davao Region. Pick a day to filter the vault, sync a batch
          to your calendar, or reserve micro-lots straight from the roaster.
        </p>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#55615D] font-sans">Next 14 Days</h2>
          {selectedDay && (
            <button
              onClick={() => setSelectedDay(null)}
              className="text-[11px] font-bold font-sans text-[#C86428] underline underline-offset-2"
            >
              Clear day filter
            </button>
          )}
        </div>
        <DropCalendarStrip drops={drops} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
      </section>

      {limited.length > 0 && !selectedDay && (
        <section className="space-y-3">
          <h2 className="inline-flex items-center gap-2 font-cooper text-lg sm:text-xl font-bold text-[#1A2225]">
            <Flame className="w-5 h-5 text-[#C86428]" />
            Micro-Lot Vault
          </h2>
          <div className="grid lg:grid-cols-2 gap-3">
            {limited.map((drop) => (
              <BeanDropCard
                key={`limited-${drop.id}`}
                drop={drop}
                bean={beansById.get(drop.beanId)}
                onInspectBean={onInspectBean}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="inline-flex items-center gap-2 font-cooper text-lg sm:text-xl font-bold text-[#1A2225]">
          <Vault className="w-5 h-5 text-[#55615D]" />
          {selectedDay
            ? `Batches on ${new Date(`${selectedDay}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}`
            : 'All Scheduled Batches'}
        </h2>
        {visibleDrops.length === 0 ? (
          <p className="text-sm font-sans text-[#55615D] py-8 text-center">
            No batches on this day yet. Roasters schedule new batches all week.
          </p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-3">
            {visibleDrops.map((drop) => (
              <BeanDropCard key={drop.id} drop={drop} bean={beansById.get(drop.beanId)} onInspectBean={onInspectBean} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
