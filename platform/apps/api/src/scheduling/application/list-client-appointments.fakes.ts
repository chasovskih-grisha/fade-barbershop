// Фікстури ListClientAppointments (T-041): рядок booking з довідниками у
// пам'яті. Окремо від *.spec.ts — LOC-гейт.
import { PrismaService } from '../../shared/prisma/prisma.service';

const START = new Date('2026-09-28T12:00:00.000Z');
const END = new Date('2026-09-28T12:45:00.000Z');

/** Рядок booking із розумними дефолтами; overrides — точкові зміни полів. */
export function bookingRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bk-1',
    appointmentId: 'apt-1',
    barberId: 'barber-1',
    locationId: 'loc-1',
    serviceId: 'svc-1',
    agreedPrice: 700,
    status: 'booked',
    partyId: null,
    haircutReferenceId: 'photo-1',
    appointmentComment: 'коротше',
    start: START,
    end: END,
    clientId: 'user-1',
    // Снепшот депозиту (PAY-ADM-09): 30% від 700 = 210, вікно 4 год.
    depositAmount: 210,
    depositPercent: 30,
    depositRounding: 10,
    cancellationWindowHours: 4,
    ...overrides,
  };
}

/** Prisma-фейк із заданими рядками booking + довідниками сервісу/барбера/локації. */
export function prismaOf(
  rows: ReturnType<typeof bookingRow>[],
  holds: Array<{ appointmentId: string; expiresAt: Date; status: string }> = []
) {
  const findMany = jest.fn().mockResolvedValue(rows);
  const prisma = {
    booking: { findMany },
    depositHold: { findMany: jest.fn().mockResolvedValue(holds) },
    service: { findMany: jest.fn().mockResolvedValue([{ id: 'svc-1', name: 'Стрижка' }]) },
    user: { findMany: jest.fn().mockResolvedValue([{ id: 'barber-1', name: 'Олег' }]) },
    location: { findMany: jest.fn().mockResolvedValue([{ id: 'loc-1', name: 'Поділ' }]) },
  };
  return { prisma: prisma as unknown as PrismaService, findMany };
}
