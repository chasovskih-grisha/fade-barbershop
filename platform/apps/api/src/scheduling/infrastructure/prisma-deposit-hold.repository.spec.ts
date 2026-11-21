// T-4619a: durable-адаптер утримань — upsert за візитом і фільтр за статусом.
import type { PrismaService } from '../../shared/prisma/prisma.service';
import { openDepositHold, type DepositHold } from '../domain/deposit-hold';
import { PrismaDepositHoldRepository } from './prisma-deposit-hold.repository';

const NOW = new Date('2026-11-20T10:00:00.000Z');

function hold(): DepositHold {
  return openDepositHold({
    id: 'hold-1',
    appointmentId: 'apt-1',
    barberId: 'barber-1',
    locationId: 'loc-1',
    startAt: new Date('2026-11-21T09:00:00.000Z'),
    endAt: new Date('2026-11-21T09:30:00.000Z'),
    depositAmount: 300,
    now: NOW,
  });
}

function make() {
  const rows = new Map<string, any>();
  const prisma = {
    depositHold: {
      findUnique: async ({ where }: any) => rows.get(where.appointmentId) ?? null,
      upsert: async ({ where, create, update }: any) => {
        const previous = rows.get(where.appointmentId);
        rows.set(where.appointmentId, previous ? { ...previous, ...update } : create);
        return rows.get(where.appointmentId);
      },
      findMany: async ({ where }: any) =>
        [...rows.values()].filter((row) => !where?.status || row.status === where.status),
    },
  } as unknown as PrismaService;
  return { repository: new PrismaDepositHoldRepository(prisma), rows };
}

describe('PrismaDepositHoldRepository (T-4619a)', () => {
  it('creates and then updates one row per visit', async () => {
    const { repository, rows } = make();
    const open = hold();

    await repository.save(open);
    await repository.save({ ...open, status: 'captured', updatedAt: NOW });

    expect(rows.size).toBe(1);
    await expect(repository.findByAppointmentId('apt-1')).resolves.toMatchObject({
      id: 'hold-1',
      appointmentId: 'apt-1',
      depositAmount: 300,
      status: 'captured',
    });
  });

  it('lists only the requested status', async () => {
    const { repository } = make();
    const open = hold();
    await repository.save(open);
    await repository.save({ ...open, appointmentId: 'apt-2', status: 'expired' });

    await expect(repository.listByStatus('active')).resolves.toHaveLength(1);
    await expect(repository.listByStatus('expired')).resolves.toHaveLength(1);
  });

  it('returns null for an unknown visit', async () => {
    const { repository } = make();
    await expect(repository.findByAppointmentId('nope')).resolves.toBeNull();
  });
});
