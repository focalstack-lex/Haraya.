import type { Cafe, Bean } from '../types/coffee';

/**
 * Buyer-side preferences kept per browser: saved cafes and beans, custom coffee
 * lists (shareable), followed roasters, recently viewed records, and drop
 * reminders. Every mutation notifies subscribers so dependent views re-render.
 */

const KEYS = {
  SAVED_CAFES: 'haraya_saved_cafes',
  SAVED_BEANS: 'haraya_saved_beans',
  LISTS: 'haraya_custom_lists',
  FOLLOWING: 'haraya_following',
  RECENT: 'haraya_recent_views',
  REMINDERS: 'haraya_drop_reminders',
  SHARED: 'haraya_shared_lists',
} as const;

export interface CustomList {
  id: string;
  name: string;
  cafeIds: string[];
  beanIds: string[];
  createdAt: string;
}

export interface SharedList {
  kind: 'list';
  name: string;
  cafeIds: string[];
  beanIds: string[];
}

const listeners = new Set<() => void>();
let version = 0;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function notify(): void {
  version += 1;
  listeners.forEach((listener) => listener());
}

function makeListId(): string {
  return `list-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export const userPrefsService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getVersion(): number {
    return version;
  },

  // Saved cafes and beans ----------------------------------------------------

  getSavedCafes(): string[] {
    return readJson<string[]>(KEYS.SAVED_CAFES, []);
  },

  isCafeSaved(cafeId: string): boolean {
    return this.getSavedCafes().includes(cafeId);
  },

  toggleSavedCafe(cafe: Cafe): boolean {
    const saved = this.getSavedCafes();
    const index = saved.indexOf(cafe.id);
    let nowSaved: boolean;
    if (index === -1) {
      saved.push(cafe.id);
      nowSaved = true;
    } else {
      saved.splice(index, 1);
      nowSaved = false;
    }
    writeJson(KEYS.SAVED_CAFES, saved);
    notify();
    return nowSaved;
  },

  getSavedBeans(): string[] {
    return readJson<string[]>(KEYS.SAVED_BEANS, []);
  },

  isBeanSaved(beanId: string): boolean {
    return this.getSavedBeans().includes(beanId);
  },

  toggleSavedBean(bean: Bean): boolean {
    const saved = this.getSavedBeans();
    const index = saved.indexOf(bean.id);
    let nowSaved: boolean;
    if (index === -1) {
      saved.push(bean.id);
      nowSaved = true;
    } else {
      saved.splice(index, 1);
      nowSaved = false;
    }
    writeJson(KEYS.SAVED_BEANS, saved);
    notify();
    return nowSaved;
  },

  getSavedCount(): number {
    return this.getSavedCafes().length + this.getSavedBeans().length;
  },

  // Custom lists -------------------------------------------------------------

  getLists(): CustomList[] {
    return readJson<CustomList[]>(KEYS.LISTS, []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getList(listId: string): CustomList | undefined {
    return this.getLists().find((list) => list.id === listId);
  },

  createList(name: string): CustomList {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('List name is required.');
    const list: CustomList = {
      id: makeListId(),
      name: trimmed.slice(0, 60),
      cafeIds: [],
      beanIds: [],
      createdAt: new Date().toISOString(),
    };
    const lists = this.getLists();
    lists.unshift(list);
    writeJson(KEYS.LISTS, lists);
    notify();
    return list;
  },

  deleteList(listId: string): void {
    writeJson(KEYS.LISTS, this.getLists().filter((list) => list.id !== listId));
    notify();
  },

  renameList(listId: string, name: string): void {
    const lists = this.getLists();
    const index = lists.findIndex((list) => list.id === listId);
    if (index === -1) return;
    lists[index] = { ...lists[index], name: name.trim().slice(0, 60) || lists[index].name };
    writeJson(KEYS.LISTS, lists);
    notify();
  },

  addCafeToList(listId: string, cafeId: string): void {
    const lists = this.getLists();
    const index = lists.findIndex((list) => list.id === listId);
    if (index === -1) return;
    if (!lists[index].cafeIds.includes(cafeId)) lists[index].cafeIds.push(cafeId);
    writeJson(KEYS.LISTS, lists);
    notify();
  },

  addBeanToList(listId: string, beanId: string): void {
    const lists = this.getLists();
    const index = lists.findIndex((list) => list.id === listId);
    if (index === -1) return;
    if (!lists[index].beanIds.includes(beanId)) lists[index].beanIds.push(beanId);
    writeJson(KEYS.LISTS, lists);
    notify();
  },

  removeCafeFromList(listId: string, cafeId: string): void {
    const lists = this.getLists();
    const index = lists.findIndex((list) => list.id === listId);
    if (index === -1) return;
    lists[index] = { ...lists[index], cafeIds: lists[index].cafeIds.filter((id) => id !== cafeId) };
    writeJson(KEYS.LISTS, lists);
    notify();
  },

  removeBeanFromList(listId: string, beanId: string): void {
    const lists = this.getLists();
    const index = lists.findIndex((list) => list.id === listId);
    if (index === -1) return;
    lists[index] = { ...lists[index], beanIds: lists[index].beanIds.filter((id) => id !== beanId) };
    writeJson(KEYS.LISTS, lists);
    notify();
  },

  // Shared list handoff between browser windows
  publishSharedList(shared: SharedList): void {
    writeJson(KEYS.SHARED, shared);
  },

  consumeSharedList(): SharedList | null {
    return readJson<SharedList | null>(KEYS.SHARED, null);
  },

  // Following roasters -------------------------------------------------------

  getFollowing(): string[] {
    return readJson<string[]>(KEYS.FOLLOWING, []);
  },

  isFollowing(cafeId: string): boolean {
    return this.getFollowing().includes(cafeId);
  },

  toggleFollowing(cafeId: string): boolean {
    const following = this.getFollowing();
    const index = following.indexOf(cafeId);
    let nowFollowing: boolean;
    if (index === -1) {
      following.push(cafeId);
      nowFollowing = true;
    } else {
      following.splice(index, 1);
      nowFollowing = false;
    }
    writeJson(KEYS.FOLLOWING, following);
    notify();
    return nowFollowing;
  },

  // Recently viewed ----------------------------------------------------------

  getRecentViews(): string[] {
    return readJson<string[]>(KEYS.RECENT, []);
  },

  pushRecentView(id: string): void {
    const recent = [id, ...this.getRecentViews().filter((view) => view !== id)].slice(0, 12);
    writeJson(KEYS.RECENT, recent);
  },

  // Drop reminders -----------------------------------------------------------

  getReminders(): string[] {
    return readJson<string[]>(KEYS.REMINDERS, []);
  },

  isReminded(dropId: string): boolean {
    return this.getReminders().includes(dropId);
  },

  toggleReminder(dropId: string): boolean {
    const reminders = this.getReminders();
    const index = reminders.indexOf(dropId);
    let nowReminded: boolean;
    if (index === -1) {
      reminders.push(dropId);
      nowReminded = true;
    } else {
      reminders.splice(index, 1);
      nowReminded = false;
    }
    writeJson(KEYS.REMINDERS, reminders);
    notify();
    return nowReminded;
  },
};
