// Фейк-стор політики онлайн-букінгу (T-4542): правила перевіряються без
// Prisma; кожен тест виставляє лише потрібні факти про клієнта.
import type { OnlineBookingStore, StoredOnlineBookingPolicy } from './booking-policy.ports';

export class FakeStore implements OnlineBookingStore {
  policy: StoredOnlineBookingPolicy | null = null;
  active = 0;
  duplicate = false;
  noShows = 0;
  readonly upserts: { locationId: string | null }[] = [];

  async policyFor(): Promise<StoredOnlineBookingPolicy | null> {
    return this.policy;
  }
  async countActiveBookings(): Promise<number> {
    return this.active;
  }
  async hasDuplicate(): Promise<boolean> {
    return this.duplicate;
  }
  async countNoShows(): Promise<number> {
    return this.noShows;
  }
  async upsert(locationId: string | null): Promise<void> {
    this.upserts.push({ locationId });
  }
}
