import React, { useState } from 'react';
import { CalendarPlus, Bell, BellRing, Check, Download } from 'lucide-react';
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

  const statusTone =
    status === 'live' ? 'text-[#3E5C48]' : status === 'soldOut' ? 'text-[#8C3A2E]' : 'text-[#7D5C3D]';
  const statusDot = status === 'live' ? 'bg-[#3E5C48]' : status === 'soldOut' ? 'bg-[#8C3A2E]' : 'bg-[#906D4B]';
  const fillButton =
    'h-11 px-3.5 rounded-full ios-fill text-[14px] font-semibold font-sans text-[#7D5C3D] inline-flex items-center justify-center gap-1.5 hover:bg-[#766046]/20 ios-press';

  return (
    <article className="card-ambient rounded-[20px] bg-[#FFFDF9] overflow-hidden">
      <div className="flex gap-3.5 p-3.5 sm:p-4">
        <button
          onClick={() => bean && onInspectBean(bean.id)}
          className="shrink-0 rounded-[14px] ios-press"
          aria-label={`Inspect ${bean?.name ?? drop.title}`}
        >
          <img
            src={drop.coverImage}
            alt=""
            className="h-20 w-20 sm:h-24 sm:w-24 rounded-[14px] object-cover bg-[#13191F]"
            loading="lazy"
          />
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 ios-footnote font-medium ${statusTone}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusDot} ${status === 'live' ? 'animate-status-pulse' : ''}`} aria-hidden="true" />
              {status === 'live' ? 'Live now' : status === 'soldOut' ? 'Sold out' : 'Scheduled'}
            </span>
            {bean?.isLimited && (
              <span className="h-5.5 px-2 rounded-full ios-fill text-[11px] font-medium font-sans text-[#594C3D] inline-flex items-center">
                Micro-lot
              </span>
            )}
          </div>

          <h3 className="ios-headline text-[#13191F] line-clamp-2">{bean ? bean.name : drop.title}</h3>
          <p className="ios-footnote text-[#594C3D] truncate">
            {drop.roasterName}, {bean ? bean.tastingNotes.slice(0, 3).join(', ') : drop.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
            <DropCountdownTimer dropAt={drop.dropAt} />
            <span className="ios-footnote text-[#594C3D] font-mono">
              {new Date(drop.dropAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-[14px] font-mono font-semibold text-[#13191F]">
            ₱{drop.price}
            <span className="font-sans font-normal ios-footnote text-[#594C3D]"> per bag, {drop.batchBags} in the batch</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-3 ios-hairline-t">
        {bean && (
          <button
            onClick={() => onInspectBean(bean.id)}
            className="h-11 px-4.5 flex-1 min-[420px]:flex-none rounded-full bg-[#906D4B] text-[#FFFDF9] text-[14px] font-semibold font-sans hover:bg-[#7D5C3D] ios-press"
          >
            Reserve or Inquire
          </button>
        )}
        <button onClick={syncGoogle} className={fillButton} aria-label="Add to Google Calendar">
          <CalendarPlus className="w-4 h-4" />
          <span>Google</span>
        </button>
        <button onClick={downloadIcsFile} className={fillButton} aria-label={synced ? 'Calendar file saved' : 'Download calendar file'}>
          {synced ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          <span className="font-mono">.ics</span>
        </button>
        <button
          onClick={() => userPrefsService.toggleReminder(drop.id)}
          aria-pressed={reminded}
          className={`h-11 px-3.5 rounded-full text-[14px] font-semibold font-sans inline-flex items-center gap-1.5 ios-press ml-auto ${
            reminded ? 'bg-[#906D4B] text-[#FFFDF9] hover:bg-[#7D5C3D]' : 'ios-fill text-[#7D5C3D] hover:bg-[#766046]/20'
          }`}
        >
          {reminded ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          {reminded ? 'Reminding' : 'Remind me'}
        </button>
      </div>
    </article>
  );
};
