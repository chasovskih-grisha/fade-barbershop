// Спільні фейки для специфікацій деталей візиту: рядки Booking/outbox/
// сповіщення, Prisma-подібний стенд і setup read-моделі. Окремим файлом,
// щоб специфікації не дублювали стенд.

import { AdminBookingDetail } from './admin-booking-detail';

export const bookingRow = {
  id: 'bk-1',
  appointmentId: 'apt-1',
  barberId: 'barber-1',
  locationId: 'loc-1',
  serviceId: 'svc-1',
  agreedPrice: 600,
  agreedDuration: 60,
  durationVariant: 'long',
  fulfillmentMode: 'sequential',
  partyId: null,
  partyRole: null,
  start: new Date('2026-11-09T10:00:00.000Z'),
  end: new Date('2026-11-09T10:30:00.000Z'),
  version: 3,
  status: 'confirmed',
  cancelReason: null,
  haircutReferenceId: null,
  appointmentComment: 'Без машинки',
  clientId: 'user-1',
  source: 'admin',
};

export const outboxRow = {
  id: 'msg-1',
  type: 'scheduling.appointment.rescheduled',
  // prettier-ignore
  payload: { oldStart: '2026-11-09T09:00:00.000Z', oldEnd: '2026-11-09T09:30:00.000Z', newStart: '2026-11-09T10:00:00.000Z', newEnd: '2026-11-09T10:30:00.000Z', actorId: 'admin-1', actorRole: 'admin' },
  status: 'pending',
  createdAt: new Date('2026-11-08T12:00:00.000Z'),
  publishedAt: null,
};

export const notifRow = {
  id: 'n-1',
  type: outboxRow.type,
  channel: 'email',
  recipient: 'a@b.c',
  subject: 'Візит перенесено',
  status: 'sent',
  detail: null,
  sentAt: new Date('2026-11-08T12:00:05.000Z'),
};

export const partyRow = {
  id: 'party-1',
  role: 'father-son',
  mode: 'parallel',
  userId: null,
  barberId: 'barber-1',
  barberIds: ['barber-1', 'barber-2'],
  locationId: 'loc-1',
  serviceId: 'svc-1',
  agreedPrice: 1200,
  date: new Date('2026-11-09T10:00:00.000Z'),
  partyLegs: [{ barberId: 'barber-2' }],
};

export function fakePrisma(overrides: Record<string, unknown> = {}) {
  return {
    booking: { findUnique: jest.fn().mockResolvedValue(bookingRow) },
    service: {
      // prettier-ignore
      findUnique: jest.fn().mockResolvedValue({ id: 'svc-1', name: 'Стрижка', duration: 30, category: 'core' }),
    },
    location: {
      // prettier-ignore
      findUnique: jest.fn().mockResolvedValue({ id: 'loc-1', code: 'CLT-01', name: 'Сіті Лейк', address: 'вул. Хрещатик 1' }),
    },
    user: {
      // prettier-ignore
      findUnique: jest.fn().mockImplementation(({ where: { id } }: { where: { id: string } }) =>
        // prettier-ignore
        Promise.resolve(id === 'barber-1' ? { id, name: 'Іван', phone: '+380501111111' } : { id, name: 'Марко', phone: '+380502223344' })
      ),
    },
    clientProfile: {
      // prettier-ignore
      findUnique: jest.fn().mockResolvedValue({ id: 'cp-1', name: 'Марко К.', vipDiscountPercent: 10, loyaltyVisitsCount: 3 }),
    },
    appointmentParty: { findUnique: jest.fn().mockResolvedValue(null) },
    outboxMessage: { findMany: jest.fn().mockResolvedValue([outboxRow]) },
    notificationRecord: { findMany: jest.fn().mockResolvedValue([notifRow]) },
    ...overrides,
  };
}

/** Read-модель на стенді + сам стенд (для перевірок вибірок). */
export function setup(overrides: Record<string, unknown> = {}) {
  const prisma = fakePrisma(overrides);
  return { readModel: new AdminBookingDetail(prisma as never), prisma };
}
