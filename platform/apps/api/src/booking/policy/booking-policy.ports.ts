// Порти політики онлайн-букінгу (T-4542): конфіг локації + факти про клієнта
// (активні записи, дублікат, no-show). Use case не знає Prisma, тож правила
// перевіряються на фейках без живої БД.
import type { NoShowBlock, OnlineBookingPolicy } from './online-booking-policy';

export const ONLINE_BOOKING_STORE = 'ONLINE_BOOKING_STORE';

export interface StoredOnlineBookingPolicy extends Partial<OnlineBookingPolicy> {
  locationId: string | null;
}

export interface DuplicateQuery {
  clientId: string;
  barberId: string;
  start: Date;
}

export interface OnlineBookingStore {
  /** Політика локації; null — беремо глобальний дефолт із тієї ж таблиці. */
  policyFor(locationId: string): Promise<StoredOnlineBookingPolicy | null>;
  countActiveBookings(clientId: string, now: Date): Promise<number>;
  hasDuplicate(query: DuplicateQuery): Promise<boolean>;
  countNoShows(clientId: string, since: Date): Promise<number>;
  /** Адмінське збереження; locationId=null — глобальний дефолт. */
  upsert(locationId: string | null, policy: OnlineBookingPolicy): Promise<void>;
}

export type { NoShowBlock };
