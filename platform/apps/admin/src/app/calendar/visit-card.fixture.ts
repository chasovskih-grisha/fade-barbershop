import type { CalendarVisit } from './visit-status';

export const visit = (overrides: Partial<CalendarVisit> = {}): CalendarVisit => ({
  id: 'apt-1',
  bookingId: 'b-1',
  appointmentId: 'apt-1',
  locationId: 'loc-1',
  barberId: 'barber-1',
  start: '2026-09-28T10:00:00.000Z',
  end: '2026-09-28T11:00:00.000Z',
  status: 'booked',
  serviceId: null,
  agreedPrice: 600,
  partyId: null,
  partyRole: null,
  haircutReferenceId: null,
  referencePhotoUrl: null,
  comment: null,
  source: 'web',
  clientId: null,
  ...overrides,
});
