import React, { useState } from 'react';
import { CalendarPlus, Bell, BellRing, Flame } from 'lucide-react';
import type { RoastDrop, Bean } from '../../types/coffee';
import { catalogService } from '../../services/catalogService';
import { userPrefsService } from '../../services/userPrefsService';
import { usePrefsVersion } from '../../hooks/useServiceVersions';
import { DropCountdownTimer } from './DropCountdownTimer';
import { buildIcsDocument, downloadIcs, googleCalendarUrl } from '../../utils/calendar';

interface BeanDropCardProps {
  drop: RoastDrop;
  bean: Bean | undefined;
  onInspectBean: (beanId: string) => void;
}

/** Vault card for one roast batch: countdown, calendar sync, reminders, reserve. */
export const BeanDropCard: React.FC<BeanDropCardProps> = ({ drop, bean, onInspectBean }) => {
  usePrefsVersion();
  const [synced, setSynced] = useState(false);

  const status = catalogService.getDropStatus(drop);
  const reminded = userPrefsService.isReminded(drop.id);

  const start = new Date(drop.dropAt);
  const end = new Date(start.getTime() + 2 * 3_600_000);

  const syncGoogle = () => {
    window.open(
      googleCalendarUrl({
        title: drop.title,
        details: `${drop.description} | ${drop.batchBags} bags at P${drop.price}`,
        location: drop.roasterName,
        start,
        end,
      }),
      '_blank',
      'noopener'
    );
  };

  const downloadIcsFile = () => {
    downloadIcs(
      `haraya-${drop.id}.ics`,
      buildIcsDocument([
        {
          uid: drop.id,
          title: drop.title,
          details: `${drop.description} | ${drop.batchBags} bags at P${drop.price}`,
          location: drop.roasterName,
          start,
          end,
        },
      ])
    );
    setSynced(true);
  };

  return (
    <article
      className={`rounded-2xl border overflow-hidden shadow-sm transition-all ${
        bean?.isLimited ? 'bg-[#FFF9E9] border-[#C86428]/40' : 'bg-[#FFF9E9] border-[#E6DCC0]'
      }`}
    >
      <div className="flex gap-3 p-3 sm:p-4">
        <button onClick={() => bean && onInspectBean(bean.id)} className="shrink-0" aria-label={`Inspect ${bean?.name ?? drop.title}`}>
          <img
            src={drop.coverImage}
            alt=""
            className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover border border-[#E6DCC0]"
            loading="lazy"
          />
        </button>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full font-sans ${
              status === 'live'
                ? 'bg-[#3E5C48] text-[#FFF9E9]'
                : status === 'soldOut'
                  ? 'bg-[#F3ECD8] text-[#55615D] border border-[#E6DCC0]'
                  : 'bg-[#C86428]/15 text-[#A34F1E] border border-[#C86428]/40'
            }`}>
              {status === 'live' ? 'LIVE NOW' : status === 'soldOut' ? 'SOLD OUT' : 'SCHEDULED'}
            </span>
            {bean?.isLimited && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase text-[#C86428] font-sans">
                <Flame className="w-3 h-3" />
                MICRO-LOT
              </span>
            )}
          </div>

          <h3 className="font-cooper text-base sm:text-lg font-bold text-[#1A2225] leading-snug line-clamp-2">
            {bean ? bean.name : drop.title}
          </h3>
          <p className="text-[11px] font-sans text-[#55615D] truncate">
            {drop.roasterName} : {bean ? bean.tastingNotes.slice(0, 3).join(', ') : drop.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <DropCountdownTimer dropAt={drop.dropAt} />
            <span className="text-[11px] font-sans text-[#55615D]">
              {new Date(drop.dropAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </span>
            <span className="text-[11px] font-sans font-bold text-[#1A2225]">
              P{drop.price} <span className="font-normal text-[#55615D]">: {drop.batchBags} bags</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-3 sm:px-4 pb-3 sm:pb-4">
        {bean && (
          <button
            onClick={() => onInspectBean(bean.id)}
            className="h-9 px-4 rounded-full bg-[#1A2225] text-[#FFF9E9] text-[11px] font-bold font-sans hover:bg-[#26302F] transition-colors"
          >
            Reserve or Inquire
          </button>
        )}
        <button
          onClick={syncGoogle}
          className="h-9 px-3.5 rounded-full border border-[#E6DCC0] text-[11px] font-bold font-sans text-[#1A2225] inline-flex items-center gap-1.5 hover:bg-[#F3ECD8] transition-colors"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          Google Cal
        </button>
        <button
          onClick={downloadIcsFile}
          className="h-9 px-3.5 rounded-full border border-[#E6DCC0] text-[11px] font-bold font-sans text-[#1A2225] inline-flex items-center gap-1.5 hover:bg-[#F3ECD8] transition-colors"
        >
          .ics {synced ? 'saved' : 'file'}
        </button>
        <button
          onClick={() => userPrefsService.toggleReminder(drop.id)}
          aria-pressed={reminded}
          className={`h-9 px-3.5 rounded-full text-[11px] font-bold font-sans inline-flex items-center gap-1.5 border transition-colors ml-auto ${
            reminded ? 'bg-[#C86428] border-[#C86428] text-[#FFF9E9]' : 'border-[#E6DCC0] text-[#1A2225] hover:bg-[#F3ECD8]'
          }`}
        >
          {reminded ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
          {reminded ? 'Reminding me' : 'Remind me'}
        </button>
      </div>
    </article>
  );
};
