import type {
  Bean,
  Cafe,
  MenuItem,
  RoastDrop,
  DropStatus,
  BeanReservation,
} from '../types/coffee';
import { CURATED_CAFES } from '../data/spots';

/**
 * Catalog layer over roaster-created and admin-moderated records kept in
 * localStorage, led by the team's curated spots (src/data/spots.ts). There is
 * no invented dataset: every listing is a real, source-checked place. Components read through
 * catalogService; writers call the mutators here, which notify subscribers so
 * the view re-queries.
 */

const KEYS = {
  CAFES: 'haraya_catalog_cafes',
  BEANS: 'haraya_catalog_beans',
  DROPS: 'haraya_catalog_drops',
  MENU_OVERRIDES: 'haraya_menu_overrides',
  RESERVATIONS: 'haraya_reservations',
  METRICS: 'haraya_metrics',
  VERIFICATIONS: 'haraya_cafe_verifications',
} as const;

export interface CafeMetrics {
  totalViews: number;
  totalSaves: number;
  /** Last 14 days from recorded events; days without events are zero. */
  days: { date: string; views: number; saves: number }[];
}

type MetricsStore = Record<
  string,
  { views: number; saves: number; daily?: Record<string, { views: number; saves: number }> }
>;

const dayKey = (date: Date) => date.toISOString().split('T')[0];

const listeners = new Set<() => void>();
let version = 0;
/** Community-added spots supplied by spotService (approved ones, plus the visitor's own pending ones). */
let communitySpots: Cafe[] = [];
/** Public listings from the cafes table, supplied by placeService (owner-managed, admin-verified). */
let listedCafes: Cafe[] = [];

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

export function makeCatalogId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * A drop whose release time has passed reads as live (stock is on the shelf);
 * soldOut is a state the roaster sets explicitly.
 */
function deriveStatus(drop: RoastDrop): DropStatus {
  if (drop.status === 'soldOut') return 'soldOut';
  return new Date(drop.dropAt).getTime() <= Date.now() ? 'live' : 'scheduled';
}

export const catalogService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getVersion(): number {
    return version;
  },

  // Cafes --------------------------------------------------------------------

  getCustomCafes(): Cafe[] {
    return readJson<Cafe[]>(KEYS.CAFES, []);
  },

  getCafes(): Cafe[] {
    const verifications = readJson<Record<string, boolean>>(KEYS.VERIFICATIONS, {});
    const custom = [...CURATED_CAFES, ...this.getCustomCafes(), ...listedCafes, ...communitySpots];
    const all = custom.map((cafe) =>
      cafe.id in verifications ? { ...cafe, verified: verifications[cafe.id] } : cafe
    );
    return all;
  },

  /** Replaces the community spots shown on the map and feed; called by spotService after each load. */
  setCommunitySpots(spots: Cafe[]): void {
    communitySpots = spots;
    notify();
  },

  /** Replaces the public listings shown on the map and feed; called by placeService after each load. */
  setListedCafes(cafes: Cafe[]): void {
    listedCafes = cafes;
    notify();
  },

  getCafeById(id: string): Cafe | undefined {
    return this.getCafes().find((cafe) => cafe.id === id);
  },

  getCafeByHandle(handle: string): Cafe | undefined {
    return this.getCafes().find((cafe) => cafe.handle === handle);
  },

  getCafesByCity(city: string): Cafe[] {
    if (city === 'All Davao Region') return this.getCafes();
    return this.getCafes().filter((cafe) => cafe.city === city);
  },

  /** Roaster-facing cafe profile creation, invoked on admin approval. */
  createCustomCafe(input: Omit<Cafe, 'id' | 'saveCount' | 'viewCount' | 'dateAdded'>): Cafe {
    const cafe: Cafe = {
      ...input,
      id: makeCatalogId('cafe'),
      saveCount: 0,
      viewCount: 0,
      dateAdded: new Date().toISOString().split('T')[0],
    };
    const cafes = this.getCustomCafes();
    cafes.push(cafe);
    writeJson(KEYS.CAFES, cafes);
    notify();
    return cafe;
  },

  setCafeVerified(cafeId: string, verified: boolean): void {
    const map = readJson<Record<string, boolean>>(KEYS.VERIFICATIONS, {});
    map[cafeId] = verified;
    writeJson(KEYS.VERIFICATIONS, map);
    notify();
  },

  updateMenu(cafeId: string, menu: MenuItem[]): void {
    const map = readJson<Record<string, MenuItem[]>>(KEYS.MENU_OVERRIDES, {});
    map[cafeId] = menu;
    writeJson(KEYS.MENU_OVERRIDES, map);
    notify();
  },

  getEffectiveMenu(cafe: Cafe): MenuItem[] {
    const overrides = readJson<Record<string, MenuItem[]>>(KEYS.MENU_OVERRIDES, {});
    return overrides[cafe.id] ?? cafe.menu;
  },

  // Beans --------------------------------------------------------------------

  getCustomBeans(): Bean[] {
    return readJson<Bean[]>(KEYS.BEANS, []);
  },

  getBeans(): Bean[] {
    return this.getCustomBeans();
  },

  getBeanById(id: string): Bean | undefined {
    return this.getBeans().find((bean) => bean.id === id);
  },

  getBeansByRoaster(roasterId: string): Bean[] {
    return this.getBeans().filter((bean) => bean.roasterId === roasterId);
  },

  getLimitedBeans(): Bean[] {
    return this.getBeans().filter((bean) => bean.isLimited);
  },

  createBean(input: Omit<Bean, 'id' | 'dateAdded'>): Bean {
    const bean: Bean = {
      ...input,
      id: makeCatalogId('bean'),
      dateAdded: new Date().toISOString().split('T')[0],
    };
    const beans = this.getCustomBeans();
    beans.push(bean);
    writeJson(KEYS.BEANS, beans);
    notify();
    return bean;
  },

  updateBean(beanId: string, patch: Partial<Omit<Bean, 'id'>>): void {
    const beans = this.getCustomBeans();
    const index = beans.findIndex((bean) => bean.id === beanId);
    if (index === -1) {
      throw new Error(`Bean ${beanId} was not found.`);
    }
    beans[index] = { ...beans[index], ...patch };
    writeJson(KEYS.BEANS, beans);
    notify();
  },

  deleteBean(beanId: string): void {
    const beans = this.getCustomBeans().filter((bean) => bean.id !== beanId);
    writeJson(KEYS.BEANS, beans);
    const drops = this.getCustomDrops().filter((drop) => drop.beanId !== beanId);
    writeJson(KEYS.DROPS, drops);
    notify();
  },

  // Drops --------------------------------------------------------------------

  getCustomDrops(): RoastDrop[] {
    return readJson<RoastDrop[]>(KEYS.DROPS, []);
  },

  getDrops(): RoastDrop[] {
    return this.getCustomDrops().sort(
      (a, b) => new Date(a.dropAt).getTime() - new Date(b.dropAt).getTime()
    );
  },

  getDropById(id: string): RoastDrop | undefined {
    return this.getDrops().find((drop) => drop.id === id);
  },

  getDropStatus(drop: RoastDrop): DropStatus {
    return deriveStatus(drop);
  },

  getDropsByRoaster(roasterId: string): RoastDrop[] {
    return this.getDrops().filter((drop) => drop.roasterId === roasterId);
  },

  createDrop(input: Omit<RoastDrop, 'id' | 'createdAt' | 'remindCount' | 'status'>): RoastDrop {
    const drop: RoastDrop = {
      ...input,
      id: makeCatalogId('drop'),
      status: 'scheduled',
      remindCount: 0,
      createdAt: new Date().toISOString(),
    };
    const drops = this.getCustomDrops();
    drops.push(drop);
    writeJson(KEYS.DROPS, drops);
    notify();
    return drop;
  },

  updateDrop(dropId: string, patch: Partial<Omit<RoastDrop, 'id'>>): void {
    const drops = this.getCustomDrops();
    const index = drops.findIndex((drop) => drop.id === dropId);
    if (index === -1) {
      throw new Error(`Drop ${dropId} was not found.`);
    }
    drops[index] = { ...drops[index], ...patch };
    writeJson(KEYS.DROPS, drops);
    notify();
  },

  markDropSoldOut(dropId: string): void {
    this.updateDrop(dropId, { status: 'soldOut' });
  },

  removeDrop(dropId: string): void {
    writeJson(KEYS.DROPS, this.getCustomDrops().filter((drop) => drop.id !== dropId));
    notify();
  },

  // Reservations -------------------------------------------------------------

  getReservations(): BeanReservation[] {
    return readJson<BeanReservation[]>(KEYS.RESERVATIONS, []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getReservationsByRoaster(roasterId: string): BeanReservation[] {
    return this.getReservations().filter((reservation) => reservation.roasterId === roasterId);
  },

  createReservation(input: Omit<BeanReservation, 'id' | 'createdAt' | 'status'>): BeanReservation {
    if (!input.name.trim() || !input.contact.trim()) {
      throw new Error('Reservation requires a name and a contact channel.');
    }
    if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 20) {
      throw new Error('Reservation quantity must be between 1 and 20 bags.');
    }
    const reservation: BeanReservation = {
      ...input,
      id: makeCatalogId('rsv'),
      createdAt: new Date().toISOString(),
      status: 'new',
    };
    const all = readJson<BeanReservation[]>(KEYS.RESERVATIONS, []);
    all.push(reservation);
    writeJson(KEYS.RESERVATIONS, all);
    notify();
    return reservation;
  },

  setReservationStatus(reservationId: string, status: BeanReservation['status']): void {
    const all = readJson<BeanReservation[]>(KEYS.RESERVATIONS, []);
    const index = all.findIndex((reservation) => reservation.id === reservationId);
    if (index === -1) return;
    all[index] = { ...all[index], status };
    writeJson(KEYS.RESERVATIONS, all);
    notify();
  },

  // Metrics ------------------------------------------------------------------

  recordView(id: string): void {
    this.recordEvent(id, 'views');
  },

  recordSave(id: string): void {
    this.recordEvent(id, 'saves');
  },

  recordEvent(id: string, kind: 'views' | 'saves'): void {
    const store = readJson<MetricsStore>(KEYS.METRICS, {});
    const entry = store[id] ?? { views: 0, saves: 0 };
    entry[kind] += 1;
    const today = dayKey(new Date());
    const daily = entry.daily ?? {};
    const day = daily[today] ?? { views: 0, saves: 0 };
    day[kind] += 1;
    daily[today] = day;
    entry.daily = daily;
    store[id] = entry;
    writeJson(KEYS.METRICS, store);
  },

  /** Recorded counts only. Nothing is padded or sampled. */
  getMetrics(id: string): CafeMetrics {
    const entry = readJson<MetricsStore>(KEYS.METRICS, {})[id];
    const days: CafeMetrics['days'] = [];
    for (let i = 13; i >= 0; i--) {
      const key = dayKey(new Date(Date.now() - i * 86_400_000));
      const day = entry?.daily?.[key];
      days.push({ date: key, views: day?.views ?? 0, saves: day?.saves ?? 0 });
    }
    return { totalViews: entry?.views ?? 0, totalSaves: entry?.saves ?? 0, days };
  },
};
