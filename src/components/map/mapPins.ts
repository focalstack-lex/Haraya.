import type { Cafe, WeeklyHours } from '../../types/coffee';
import { hasListedHours, isOpenNow } from '../../utils/calendar';

/** Whether a spot is open right now, for the list and the preview card. */
export type PinStatus = 'open' | 'closed' | 'unknown';

export const PIN_STATUS_LABELS: Record<PinStatus, string> = {
  open: 'Open',
  closed: 'Closed',
  unknown: 'Hours not listed',
};

export function pinStatus(hours: WeeklyHours, now: Date = new Date()): PinStatus {
  if (!hasListedHours(hours)) return 'unknown';
  return isOpenNow(hours, now) ? 'open' : 'closed';
}

/** Photo pins closer than this on screen merge into one stacked group. */
export const CLUSTER_RADIUS_PX = 44;
/** From this zoom in, every pin stands alone: the streets are close enough to tell spots apart. */
export const UNCLUSTER_ZOOM = 17;

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface PinCluster<T> {
  members: T[];
  /** Mean screen position of the members. */
  center: ScreenPoint;
}

/**
 * Greedy screen-space clustering: each item joins the first cluster whose center is closer than radiusPx,
 * otherwise it starts a new one. Items keep their input order, so the same catalog clusters the same way.
 */
export function clusterByPixels<T>(items: T[], project: (item: T) => ScreenPoint, radiusPx: number): PinCluster<T>[] {
  const clusters: PinCluster<T>[] = [];
  for (const item of items) {
    const point = project(item);
    const home = clusters.find((cluster) => Math.hypot(cluster.center.x - point.x, cluster.center.y - point.y) < radiusPx);
    if (home) {
      const count = home.members.push(item);
      home.center = {
        x: home.center.x + (point.x - home.center.x) / count,
        y: home.center.y + (point.y - home.center.y) / count,
      };
    } else {
      clusters.push({ members: [item], center: point });
    }
  }
  return clusters;
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapes catalog text before it is placed into Leaflet marker or tooltip HTML. */
export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);

/** The spot's profile picture: its logo, or its first photo when it has no logo. */
export const spotPhoto = (cafe: Pick<Cafe, 'logoUrl' | 'images'>): string => cafe.logoUrl || cafe.images[0] || '';

export const PHOTO_PIN_PX = 40;
/** The pin's tail tip sits this far below the top of the photo; the marker is anchored there. */
export const PHOTO_PIN_TIP_PX = 47;

// Photo sizes go inline: Leaflet's own `.leaflet-container .leaflet-marker-pane img { width: auto }` outranks a class

/** A round profile picture with a small tail pointing at the spot. The outer div scales for hover and selection. */
export function photoPinHtml(photo: string, dimmed = false): string {
  return `<div class="haraya-pin haraya-photo-pin"${dimmed ? ' style="opacity:.4"' : ''}><img src="${escapeHtml(photo)}" alt="" draggable="false" style="width:${PHOTO_PIN_PX}px;height:${PHOTO_PIN_PX}px"></div>`;
}

const STACK_PHOTO_PX = 34;
const STACK_STEP_PX = 16;
const STACK_MAX = 3;

/** Up to three overlapping profile pictures for spots too close to tell apart at this zoom. */
export function photoStackHtml(photos: string[], dimmed = false): { html: string; width: number; height: number } {
  const shown = photos.slice(0, STACK_MAX);
  const width = STACK_PHOTO_PX + (shown.length - 1) * STACK_STEP_PX;
  const images = shown
    .map(
      (photo, index) =>
        `<img src="${escapeHtml(photo)}" alt="" draggable="false" style="width:${STACK_PHOTO_PX}px;height:${STACK_PHOTO_PX}px;left:${index * STACK_STEP_PX}px;z-index:${STACK_MAX - index}">`
    )
    .join('');
  return {
    html: `<div class="haraya-pin haraya-photo-stack" style="width:${width}px;${dimmed ? 'opacity:.4;' : ''}">${images}</div>`,
    width,
    height: STACK_PHOTO_PX,
  };
}
