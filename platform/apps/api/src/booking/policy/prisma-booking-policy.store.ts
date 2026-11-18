// Prisma-адаптер політики онлайн-букінгу (T-4542): рядок локації, глобальний
// дефолт (locationId = null) і факти про клієнта. Активним вважаємо запис, що
// ще не завершився і не скасований — саме він заважає новому онлайн-запису.
import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { OnlineBookingPolicy } from './online-booking-policy';
import type {
  DuplicateQuery,
  OnlineBookingStore,
  StoredOnlineBookingPolicy,
} from './booking-policy.ports';

const INACTIVE_STATUSES = ['cancelled', 'completed', 'no_show', 'expired'];

@Injectable()
export class PrismaOnlineBookingStore implements OnlineBookingStore {
  constructor(private readonly prisma: PrismaService) {}

  async policyFor(locationId: string): Promise<StoredOnlineBookingPolicy | null> {
    const row = await this.prisma.onlineBookingPolicy.findFirst({
      where: { OR: [{ locationId }, { locationId: null }] },
      // Спершу специфічна локація, потім глобальний рядок.
      orderBy: { locationId: 'desc' },
    });
    if (!row) return null;
    return {
      locationId: row.locationId,
      minLeadMinutes: row.minLeadMinutes,
      maxHorizonDays: row.maxHorizonDays,
      cancellationDeadlineHours: row.cancellationDeadlineHours,
      rescheduleDeadlineHours: row.rescheduleDeadlineHours,
      maxActiveBookings: row.maxActiveBookings,
      allowGuestBooking: row.allowGuestBooking,
      noShowBlock: { count: row.blockNoShowsCount, windowDays: row.blockNoShowsWindowDays },
    };
  }

  async countActiveBookings(clientId: string, now: Date): Promise<number> {
    return this.prisma.booking.count({
      where: { clientId, end: { gte: now }, NOT: { status: { in: INACTIVE_STATUSES } } },
    });
  }

  async hasDuplicate(query: DuplicateQuery): Promise<boolean> {
    const found = await this.prisma.booking.count({
      where: {
        clientId: query.clientId,
        barberId: query.barberId,
        start: query.start,
        NOT: { status: { in: INACTIVE_STATUSES } },
      },
    });
    return found > 0;
  }

  async countNoShows(clientId: string, since: Date): Promise<number> {
    return this.prisma.booking.count({
      where: { clientId, status: 'no_show', start: { gte: since } },
    });
  }

  async upsert(locationId: string | null, policy: OnlineBookingPolicy): Promise<void> {
    const data = {
      minLeadMinutes: policy.minLeadMinutes,
      maxHorizonDays: policy.maxHorizonDays,
      cancellationDeadlineHours: policy.cancellationDeadlineHours,
      rescheduleDeadlineHours: policy.rescheduleDeadlineHours,
      maxActiveBookings: policy.maxActiveBookings,
      allowGuestBooking: policy.allowGuestBooking,
      blockNoShowsCount: policy.noShowBlock.count,
      blockNoShowsWindowDays: policy.noShowBlock.windowDays,
    };
    const existing = await this.prisma.onlineBookingPolicy.findFirst({ where: { locationId } });
    if (existing) {
      await this.prisma.onlineBookingPolicy.update({ where: { id: existing.id }, data });
      return;
    }
    await this.prisma.onlineBookingPolicy.create({ data: { id: uuidv7(), locationId, ...data } });
  }
}
