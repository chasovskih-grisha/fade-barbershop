// Сід фейка списку клієнтів (T-4606a/T-4606b) — окремий файл (гейт
// max-lines, ADR 0019). Три клієнти з різними лояльністю/VIP/візитами, щоб
// e2e бачив сортування visits, фільтри loyaltyStatus/locationId і цифри
// зведення. Візити p-1 йдуть на userId (Booking.clientId = User.id), p-3 — на
// профільний id; гість без профілю (clientId null) у фільтри не потрапляє.
import type { ClientListProfileRow } from '../application/client-list-reader';

/** Рядок Booking у пам'яті: статуси/ціни лежать у admin-clients.list-match.fakes.ts. */
export interface SeedBooking {
  clientId: string | null;
  locationId: string;
  start: Date;
  status?: string | null;
  agreedPrice?: number | null;
}

export interface SeededClientList {
  rows: ClientListProfileRow[];
  bookings: SeedBooking[];
}

export function seededRows(): ClientListProfileRow[] {
  return [
    {
      id: 'p-1',
      userId: 'u-1',
      name: 'Олексій Петренко',
      phone: '+380672222222',
      vipDiscountPercent: 10,
      loyaltyVisitsCount: 2,
      createdAt: new Date('2026-09-01T10:00:00.000Z'),
    },
    {
      id: 'p-2',
      userId: 'u-2',
      name: 'Богдан Коваль',
      phone: '+380501234567',
      vipDiscountPercent: null,
      loyaltyVisitsCount: 0,
      createdAt: new Date('2026-09-25T10:00:00.000Z'),
    },
    {
      id: 'p-3',
      userId: 'u-3',
      name: 'Анна Шевчук',
      phone: '+380931112233',
      vipDiscountPercent: null,
      loyaltyVisitsCount: 5,
      createdAt: new Date('2026-08-01T10:00:00.000Z'),
    },
  ];
}

/** Візити: p-1 — два завершені (400+600); p-3 — no-show і завершений (300). */
export function seededBookings(): SeedBooking[] {
  return [
    // prettier-ignore
    { clientId: 'u-1', locationId: 'loc-1', start: new Date('2026-09-20T10:00:00.000Z'),
      status: 'completed', agreedPrice: 400 },
    // prettier-ignore
    { clientId: 'u-1', locationId: 'loc-2', start: new Date('2026-10-01T12:00:00.000Z'),
      status: 'completed', agreedPrice: 600 },
    // prettier-ignore
    { clientId: 'p-3', locationId: 'loc-1', start: new Date('2026-10-05T09:00:00.000Z'),
      status: 'no_show', agreedPrice: 300 },
    // prettier-ignore
    { clientId: 'p-3', locationId: 'loc-1', start: new Date('2026-10-06T09:00:00.000Z'),
      status: 'completed', agreedPrice: 300 },
    { clientId: null, locationId: 'loc-1', start: new Date('2026-10-06T09:00:00.000Z') },
  ];
}
