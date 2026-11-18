// Журнал візиту для адмін-деталей: події outbox за агрегатом (appointment)
// + сповіщення, надіслані за ними (REF-ADM-03 «історія змін у тій же панелі»).
// Окремим файлом, бо це два запити й власна форма відповіді.

import type { PrismaService } from '../../shared/prisma/prisma.service';
import { mapEvent, mapNotification } from './admin-booking-detail.map';
import type { BookingEventView, BookingNotificationView } from './admin-booking-detail.view';

export interface BookingJournal {
  events: BookingEventView[];
  notifications: BookingNotificationView[];
}

export async function loadBookingJournal(
  prisma: PrismaService,
  aggregateId: string
): Promise<BookingJournal> {
  const rows = await prisma.outboxMessage.findMany({
    where: { aggregateId },
    orderBy: { createdAt: 'asc' },
  });
  if (rows.length === 0) return { events: [], notifications: [] };
  const sent = await prisma.notificationRecord.findMany({
    where: { eventId: { in: rows.map((row) => row.id) } },
    orderBy: { sentAt: 'asc' },
  });
  return { events: rows.map(mapEvent), notifications: sent.map(mapNotification) };
}
