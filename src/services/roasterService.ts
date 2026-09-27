import type { Account } from '../types/auth';
import type { Bean, RoastDrop, BeanReservation } from '../types/coffee';
import type { CafeMetrics } from './catalogService';
import { catalogService } from './catalogService';

/**
 * Roaster-facing facade over the catalog: everything an approved roaster or
 * cafe owner needs for the Roaster Suite dashboard, scoped to their own cafe
 * profile. Reads are served from catalogService so the storefront, feed, and
 * dashboard always see the same records.
 */

export interface RoasterOverview {
  cafeName: string;
  beanCount: number;
  dropCount: number;
  upcomingDrops: RoastDrop[];
  newReservations: BeanReservation[];
  metrics: CafeMetrics;
  lowStockBeans: Bean[];
}

function assertRoaster(account: Account, cafeProfileId: string | null): string {
  if (account.role === 'admin') {
    throw new Error('Admins moderate the catalog; they do not own a roastery profile.');
  }
  if (!cafeProfileId) {
    throw new Error('This account has no cafe profile yet. Wait for admin approval.');
  }
  return cafeProfileId;
}

export const roasterService = {
  getMyCafe(account: Account) {
    const cafeId = assertRoaster(account, account.cafeProfileId);
    const cafe = catalogService.getCafeById(cafeId);
    if (!cafe) throw new Error('Cafe profile not found. Ask an admin to re-approve your application.');
    return cafe;
  },

  getMyBeans(account: Account): Bean[] {
    const cafeId = assertRoaster(account, account.cafeProfileId);
    return catalogService.getBeansByRoaster(cafeId);
  },

  getMyDrops(account: Account): RoastDrop[] {
    const cafeId = assertRoaster(account, account.cafeProfileId);
    return catalogService.getDropsByRoaster(cafeId);
  },

  getMyReservations(account: Account): BeanReservation[] {
    const cafeId = assertRoaster(account, account.cafeProfileId);
    return catalogService.getReservationsByRoaster(cafeId);
  },

  getOverview(account: Account): RoasterOverview {
    const cafe = this.getMyCafe(account);
    const beans = this.getMyBeans(account);
    const drops = this.getMyDrops(account);
    return {
      cafeName: cafe.name,
      beanCount: beans.length,
      dropCount: drops.length,
      upcomingDrops: drops
        .filter((drop) => new Date(drop.dropAt).getTime() > Date.now())
        .slice(0, 3),
      newReservations: catalogService
        .getReservationsByRoaster(cafe.id)
        .filter((reservation) => reservation.status === 'new'),
      metrics: catalogService.getMetrics(cafe.id),
      lowStockBeans: beans.filter((bean) => bean.bagsInStock <= 10),
    };
  },

  publishBean(
    account: Account,
    input: Omit<Bean, 'id' | 'roasterId' | 'roasterName' | 'dateAdded'>
  ): Bean {
    const cafe = this.getMyCafe(account);
    return catalogService.createBean({
      ...input,
      roasterId: cafe.id,
      roasterName: cafe.name,
    });
  },

  scheduleDrop(
    account: Account,
    input: Omit<RoastDrop, 'id' | 'roasterId' | 'roasterName' | 'createdAt' | 'remindCount' | 'status'>
  ): RoastDrop {
    const cafe = this.getMyCafe(account);
    return catalogService.createDrop({
      ...input,
      roasterId: cafe.id,
      roasterName: cafe.name,
    });
  },

  markDropSoldOut(account: Account, dropId: string): void {
    const cafe = this.getMyCafe(account);
    const drop = catalogService.getDropById(dropId);
    if (!drop || drop.roasterId !== cafe.id) throw new Error('You can only update your own drops.');
    catalogService.markDropSoldOut(dropId);
  },

  setReservationStatus(account: Account, reservationId: string, status: BeanReservation['status']): void {
    const cafe = this.getMyCafe(account);
    const reservation = catalogService
      .getReservationsByRoaster(cafe.id)
      .find((candidate) => candidate.id === reservationId);
    if (!reservation) throw new Error('Reservation not found in your inbox.');
    catalogService.setReservationStatus(reservationId, status);
  },
};
