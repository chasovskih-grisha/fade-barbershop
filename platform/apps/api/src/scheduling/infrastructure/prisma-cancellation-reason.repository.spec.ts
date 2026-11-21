// T-4560: durable-адаптер журналу — append-only запис і зворотне маплення.
import type { PrismaService } from '../../shared/prisma/prisma.service';
import type { ReasonedEvent } from '../domain/cancellation-reasons';
import { PrismaCancellationReasonRepository } from './prisma-cancellation-reason.repository';

const event: ReasonedEvent = {
  appointmentId: 'apt-1',
  clientId: 'client-1',
  barberId: 'barber-1',
  serviceId: null,
  locationId: 'loc-1',
  channel: 'online_with_deposit',
  start: new Date('2026-11-20T13:00:00.000Z'),
  kind: 'no_show',
  cancelledBy: 'admin',
  reason: null,
  noShowReason: 'CLIENT_LATE',
  custom: 'запізнився на 20 хв',
  excused: true,
  recordedAt: new Date('2026-11-20T13:30:00.000Z'),
};

function make() {
  const created: any[] = [];
  const rows: any[] = [];
  const prisma = {
    cancellationReasonJournal: {
      create: async ({ data }: any) => {
        created.push(data);
        rows.push({ ...data, createdAt: new Date('2026-11-20T13:31:00.000Z') });
        return data;
      },
      findMany: async () => rows,
    },
  } as unknown as PrismaService;
  return { repository: new PrismaCancellationReasonRepository(prisma), created };
}

describe('PrismaCancellationReasonRepository (T-4560)', () => {
  it('appends a row instead of overwriting the audit trail', async () => {
    const { repository, created } = make();

    await repository.save(event);
    await repository.save({ ...event, recordedAt: new Date('2026-11-20T14:00:00.000Z') });

    expect(created).toHaveLength(2);
    expect(created[0].id).not.toBe(created[1].id);
    expect(created[0]).toMatchObject({
      appointmentId: 'apt-1',
      kind: 'no_show',
      noShowReason: 'CLIENT_LATE',
      customReason: 'запізнився на 20 хв',
      excused: true,
      cancelledBy: 'admin',
    });
  });

  it('maps stored rows back to journal entries', async () => {
    const { repository } = make();
    await repository.save(event);

    await expect(repository.list()).resolves.toEqual([
      {
        ...event,
        excused: true,
      },
    ]);
  });
});
