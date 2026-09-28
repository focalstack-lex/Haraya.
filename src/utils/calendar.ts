/**
 * Calendar and clock helpers shared by roast drops, cafe hours, and the
 * reservation sheet: Google Calendar deep links, RFC 5545 .ics documents,
 * and open-now computation from weekly hours.
 */

import type { WeeklyHours } from '../types/coffee';

export interface CalendarEventInput {
  title: string;
  details: string;
  location: string;
  start: Date;
  end: Date;
}

export interface IcsEventInput extends CalendarEventInput {
  uid: string;
}

const WEEKDAYS: (keyof WeeklyHours)[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/** `YYYYMMDDTHHMMSSZ` in UTC, the stamp format both Google Calendar and .ics use. */
export function toCalendarStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** `YYYY-MM-DD` in the browser's local time zone (not UTC), for grouping by day. */
export function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function googleCalendarUrl({ title, details, location, start, end }: CalendarEventInput): string {
  const query = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(title)}`,
    `dates=${toCalendarStamp(start)}/${toCalendarStamp(end)}`,
    `details=${encodeURIComponent(details)}`,
    `location=${encodeURIComponent(location)}`,
  ].join('&');
  return `https://calendar.google.com/calendar/render?${query}`;
}

export function buildIcsDocument(events: IcsEventInput[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Haraya//Davao Bean Drops//EN',
    'CALSCALE:GREGORIAN',
  ];
  for (const event of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}@haraya.local`,
      `DTSTAMP:${toCalendarStamp(new Date())}`,
      `DTSTART:${toCalendarStamp(event.start)}`,
      `DTEND:${toCalendarStamp(event.end)}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      `DESCRIPTION:${escapeIcs(event.details)}`,
      `LOCATION:${escapeIcs(event.location)}`,
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function downloadIcs(filename: string, document: string): void {
  const blob = new Blob([document], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** "HH:MM" to minutes since midnight; null stays null. */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Whether the cafe is open right now. Handles overnight closes (a 01:00 close
 * counts against the previous day's window) and closed days.
 */
export function isOpenNow(hours: WeeklyHours, now: Date = new Date()): boolean {
  const todayName = WEEKDAYS[now.getDay()];
  const yesterdayName = WEEKDAYS[(now.getDay() + 6) % 7];
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  const today = hours[todayName];
  if (today.open && today.close && toMinutes(today.open) <= minutesNow && minutesNow < toMinutes(today.close)) {
    return true;
  }

  const yesterday = hours[yesterdayName];
  if (yesterday.open && yesterday.close) {
    const closeMin = toMinutes(yesterday.close);
    const opensNextDay = closeMin <= toMinutes(yesterday.open);
    if (opensNextDay && minutesNow < closeMin) return true;
  }
  return false;
}

/**
 * Minutes left before the cafe closes, 0 when it is closed. Counts overnight windows
 * (an 18:00 to 01:00 day runs past midnight, and just after midnight the previous day's window applies).
 */
export function minutesUntilClose(hours: WeeklyHours, now: Date = new Date()): number {
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  const today = hours[WEEKDAYS[now.getDay()]];
  if (today.open && today.close) {
    const open = toMinutes(today.open);
    let close = toMinutes(today.close);
    if (close <= open) close += 24 * 60;
    if (open <= minutesNow && minutesNow < close) return close - minutesNow;
  }

  const yesterday = hours[WEEKDAYS[(now.getDay() + 6) % 7]];
  if (yesterday.open && yesterday.close) {
    const close = toMinutes(yesterday.close);
    if (close <= toMinutes(yesterday.open) && minutesNow < close) return close - minutesNow;
  }
  return 0;
}

/** Human "closes 10:00 PM" style summary for the open-now pill. */
export function hoursTodayLabel(hours: WeeklyHours, now: Date = new Date()): string {
  const today = hours[WEEKDAYS[now.getDay()]];
  if (!today.open || !today.close) return 'Closed today';
  return `Open ${today.open} to ${today.close}`;
}
