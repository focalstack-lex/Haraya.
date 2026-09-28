import React, { useMemo, useState } from 'react';
import { LargeTitle } from '../common/LargeTitle';
import { AyaMascot } from '../common/AyaMascot';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-6 sm:pt-4 space-y-6">
      <LargeTitle
        title="Roast Drops"
        subtitle="Fresh batches across the Davao Region, fourteen days out."
        trailing={<AyaMascot pose="drops" size={76} alt="" />}
      />

      <section className="space-y-2" aria-labelledby="drops-calendar-title">
        <div className="flex items-center justify-between gap-3 min-h-11">
          <h2 id="drops-calendar-title" className="px-4 text-[13px] text-[#594C3D]">
            Next 14 days
          </h2>
          {selectedDay && (
            <button
              onClick={() => setSelectedDay(null)}
              className="h-11 px-3 -mr-3 text-[15px] font-medium font-sans text-[#7D5C3D] ios-press"
            >
              Show all
            </button>
          )}
        </div>
        <DropCalendarStrip drops={drops} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
      </section>

      {limited.length > 0 && !selectedDay && (
        <section className="space-y-3">
          <h2 className="ios-title px-1">Micro-lot vault</h2>
          <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
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
        <h2 className="ios-title px-1">
          {selectedDay
            ? new Date(`${selectedDay}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
            : 'All scheduled batches'}
        </h2>
        {visibleDrops.length === 0 ? (
          <div className="py-12 text-center space-y-1">
            <p className="ios-headline text-[#13191F]">No batches on this day</p>
            <p className="text-[14px] font-sans text-[#594C3D]">Roasters schedule new batches all week.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
            {visibleDrops.map((drop) => (
              <BeanDropCard key={drop.id} drop={drop} bean={beansById.get(drop.beanId)} onInspectBean={onInspectBean} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
