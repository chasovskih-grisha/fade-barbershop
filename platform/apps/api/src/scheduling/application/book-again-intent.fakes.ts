// Фікстури BookAgainIntentReader (T-4617a): prisma-фейк із рядком візиту
// і довідниками. Окремо від *.spec.ts — LOC-гейт.
import { PrismaService } from '../../shared/prisma/prisma.service';

const BOOKING = {
  barberId: 'barber-1',
  locationId: 'loc-1',
  serviceId: 'svc-1',
  status: 'completed',
};

/** Значення з overrides[key], інакше default; дозволяє підставити null. */
function pick(overrides: Record<string, unknown>, key: string, fallback: unknown) {
  return key in overrides ? overrides[key] : fallback;
}

export function prismaOf(overrides: Record<string, unknown> = {}) {
  const create = jest.fn();
  const prisma = {
    booking: {
      findFirst: jest.fn().mockResolvedValue(pick(overrides, 'booking', BOOKING)),
      create,
    },
    location: {
      findUnique: jest
        .fn()
        .mockResolvedValue(
          pick(overrides, 'location', { id: 'loc-1', name: 'Поділ', active: true })
        ),
    },
    service: {
      findUnique: jest
        .fn()
        .mockResolvedValue(
          pick(overrides, 'service', { id: 'svc-1', name: 'Стрижка', active: true })
        ),
    },
    user: {
      findUnique: jest
        .fn()
        .mockResolvedValue(
          pick(overrides, 'barber', { id: 'barber-1', name: 'Олег', active: true, role: 'barber' })
        ),
    },
    staffAssignment: {
      findUnique: jest.fn().mockResolvedValue(pick(overrides, 'assignment', { id: 'sa-1' })),
    },
    servicePrice: {
      findUnique: jest
        .fn()
        .mockResolvedValue(pick(overrides, 'price', { amount: 700, active: true })),
    },
  };
  return { prisma: prisma as unknown as PrismaService, create };
}
