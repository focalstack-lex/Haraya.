import { supabase } from '../config/supabase';
import { sessionService } from './sessionService';

/**
 * In-app notifications (table notifications, 20260930020000): written by database triggers when a spot or
 * application is reviewed, a report is closed, or someone clinks a visit. The signed-in user reads their
 * own and marks them read; nothing is sent by email or push.
 */

export interface NotificationRow {
  id: string;
  kind: string;
  title: string;
  body: string;
  /** A Haraya hash route to open, or empty. */
  link: string;
  created_at: string;
  read_at: string | null;
}

const listeners = new Set<() => void>();
let version = 0;
let started = false;
let lastUserId: string | null = null;
let rows: NotificationRow[] = [];

function notify(): void {
  version += 1;
  listeners.forEach((listener) => listener());
}

export const notificationService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getVersion(): number {
    return version;
  },

  getAll(): NotificationRow[] {
    return rows;
  },

  getUnreadCount(): number {
    return rows.filter((row) => row.read_at === null).length;
  },

  /** Idempotent: loads now and again whenever the signed-in user changes. */
  async start(): Promise<void> {
    if (started) return;
    started = true;
    if (!supabase) return;
    lastUserId = sessionService.getUser()?.id ?? null;
    sessionService.subscribe(() => {
      const userId = sessionService.getUser()?.id ?? null;
      if (userId === lastUserId) return;
      lastUserId = userId;
      void notificationService.refresh();
    });
    await notificationService.refresh();
  },

  async refresh(): Promise<void> {
    if (!supabase || !sessionService.getUser()) {
      if (rows.length > 0) {
        rows = [];
        notify();
      }
      return;
    }
    const { data, error } = await supabase
      .from('notifications')
      .select('id, kind, title, body, link, created_at, read_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      // Missing table means the database update is not applied yet: no notifications, no noise
      if (!/schema cache|does not exist|Could not find/i.test(error.message)) {
        console.warn('Haraya: could not load notifications', error.message);
      }
      return;
    }
    rows = (data ?? []) as NotificationRow[];
    notify();
  },

  async markAllRead(): Promise<void> {
    const user = sessionService.getUser();
    if (!supabase || !user || notificationService.getUnreadCount() === 0) return;
    const now = new Date().toISOString();
    rows = rows.map((row) => (row.read_at === null ? { ...row, read_at: now } : row));
    notify();
    const { error } = await supabase.from('notifications').update({ read_at: now }).eq('user_id', user.id).is('read_at', null);
    if (error) console.warn('Haraya: could not mark notifications read', error.message);
  },
};
