// Фейкові деталі візиту для тестів картки: повна відповідь GET
// /admin/bookings/:id + override-варіанти для часткових даних.
import type { BookingDetail, BookingPartyView } from './booking-types';

export const PARTY: BookingPartyView = {
  id: 'party-1',
  role: 'father-son',
  mode: 'parallel',
  userId: null,
  barberId: 'barber-1',
  barberIds: ['barber-1'],
  locationId: 'loc-1',
  serviceId: 'svc-1',
  agreedPrice: 1200,
  date: '2026-11-09T10:00:00.000Z',
  legs: [{ barberId: 'barber-2' }],
};

export const detailFixture = (overrides: Partial<BookingDetail> = {}): BookingDetail => ({
  id: '74cf0038-619c-4f04-addf-e42abcc6f966',
  appointmentId: 'apt-1',
  status: 'confirmed',
  cancelReason: null,
  start: '2026-11-09T10:00:00.000Z',
  end: '2026-11-09T10:30:00.000Z',
  durationMinutes: 30,
  agreedPrice: 600,
  fulfillmentMode: 'sequential',
  source: 'admin',
  comment: 'Без машинки',
  haircutReferenceId: null,
  partyRole: null,
  version: 3,
  service: { id: 'svc-1', name: 'Стрижка', duration: 30, category: 'core' },
  location: { id: 'loc-1', code: 'CLT-01', name: 'Сіті Лейк', address: 'вул. Хрещатик 1' },
  barber: { id: 'barber-1', name: 'Іван', phone: '+380501111111' },
  client: {
    userId: 'user-1',
    profileId: 'cp-1',
    name: 'Марко',
    phone: '+380502223344',
    vipDiscountPercent: 10,
    loyaltyVisitsCount: 3,
  },
  party: null,
  events: [
    {
      id: 'msg-1',
      type: 'scheduling.appointment.rescheduled',
      label: 'Перенесено',
      occurredAt: '2026-11-08T12:00:00.000Z',
      publishedAt: null,
      status: 'pending',
      actor: 'admin · admin-1',
      details: ['09:00–09:30 → 10:00–10:30'],
    },
  ],
  notifications: [
    {
      id: 'n-1',
      type: 'scheduling.appointment.rescheduled',
      channel: 'email',
      recipient: 'a@b.c',
      subject: 'Візит перенесено',
      status: 'sent',
      detail: null,
      sentAt: '2026-11-08T12:00:05.000Z',
    },
  ],
  ...overrides,
});
