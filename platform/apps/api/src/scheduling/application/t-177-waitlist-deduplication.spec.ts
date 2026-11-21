/* eslint-disable max-lines -- cohesive module (126 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Специфікація T-177: клієнт не отримує другу чергу, а історія візитів
// впливає на пріоритет. Порты — in-memory, без Prisma.
import type { ClientRepository } from '../../clients/domain/repositories';
import type { AppointmentRecord, AppointmentRepository } from '../domain/repositories';
import type { WaitlistEntry, WaitlistQueue } from '../domain/waitlist-queue';
import { T177WaitlistDeduplicationUseCase } from './t-177-waitlist-deduplication.use-case';

function entry(overrides: Partial<WaitlistEntry> = {}): WaitlistEntry {
  return {
    id: 'entry-1',
    clientId: 'client-1',
    serviceId: 'service-cut',
    addedAt: new Date('2026-11-18T09:00:00.000Z'),
    status: 'active',
    ...overrides,
  };
}

function booking(status: string): AppointmentRecord {
  return {
    id: 'booking-1',
    clientId: 'client-1',
    barberId: 'barber-1',
    serviceId: 'service-cut',
    startTime: new Date('2026-11-10T10:00:00.000Z'),
    status,
    source: 'web',
    createdAt: new Date('2026-11-01T10:00:00.000Z'),
    updatedAt: new Date('2026-11-01T10:00:00.000Z'),
  };
}

function harness(
  options: { activeEntry?: WaitlistEntry | null; bookings?: AppointmentRecord[] } = {}
) {
  const added: unknown[] = [];
  const moved: string[] = [];
  const removed: string[] = [];

  const waitlistQueue = {
    getActiveEntry: jest.fn(async () => options.activeEntry ?? null),
    addEntry: jest.fn(async (input: unknown) => {
      added.push(input);
      return entry();
    }),
    moveToFront: jest.fn(async (id: string) => {
      moved.push(id);
    }),
    removeEntry: jest.fn(async (id: string) => {
      removed.push(id);
    }),
  } as unknown as WaitlistQueue;

  const clientRepo = {
    getById: jest.fn(async (id: string) => ({ id })),
    getNoShowHistory: jest.fn(async () => []),
  } as unknown as ClientRepository;

  const appointmentRepo = {
    create: jest.fn(async () => undefined),
    findMany: jest.fn(async () => options.bookings ?? []),
  } as unknown as AppointmentRepository;

  return {
    useCase: new T177WaitlistDeduplicationUseCase(waitlistQueue, clientRepo, appointmentRepo),
    added,
    moved,
    removed,
    waitlistQueue,
    appointmentRepo,
  };
}

describe('T177WaitlistDeduplicationUseCase', () => {
  it('treats a client with no queue entry and no recent visit as new', async () => {
    const { useCase, appointmentRepo } = harness();

    const result = await useCase.checkDeduplication({
      clientId: 'client-1',
      serviceId: 'service-cut',
    });

    expect(result).toEqual({ isDuplicate: false, existingEntry: undefined, shouldPromote: true });
    expect(appointmentRepo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ clientId: 'client-1', status: 'completed' }),
      })
    );
  });

  it('returns the existing entry when the client is already queued', async () => {
    const { useCase } = harness({ activeEntry: entry() });

    const result = await useCase.checkDeduplication({
      clientId: 'client-1',
      serviceId: 'service-cut',
    });

    expect(result.isDuplicate).toBe(true);
    expect(result.existingEntry).toEqual({
      entryId: 'entry-1',
      bookedAt: '2026-11-18T09:00:00.000Z',
      status: 'active',
    });
    expect(result.shouldPromote).toBe(false);
  });

  it('promotes a returning client who completed a visit in the window', async () => {
    const { useCase } = harness({ bookings: [booking('completed')] });

    const result = await useCase.checkDeduplication({
      clientId: 'client-1',
      serviceId: 'service-cut',
    });

    expect(result.isDuplicate).toBe(true);
    expect(result.shouldPromote).toBe(true);
  });

  it('creates a new entry when nothing exists', async () => {
    const { useCase, added, moved } = harness();

    const result = await useCase.upsertWaitlistEntry('client-1', 'service-cut');

    expect(result.duplicate).toBe(false);
    expect(result.success).toBe(true);
    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({
      clientId: 'client-1',
      serviceId: 'service-cut',
      status: 'active',
    });
    expect(moved).toHaveLength(0);
  });

  it('moves the existing entry to the front instead of duplicating it', async () => {
    const { useCase, added, moved } = harness({ activeEntry: entry() });

    const result = await useCase.upsertWaitlistEntry('client-1', 'service-cut');

    expect(result).toEqual({ success: true, entryId: 'entry-1', duplicate: true });
    expect(moved).toEqual(['entry-1']);
    expect(added).toHaveLength(0);
  });

  it('removes an entry when the client books', async () => {
    const { useCase, removed } = harness();

    await expect(useCase.removeWaitlistEntry('entry-9')).resolves.toEqual({ success: true });
    expect(removed).toEqual(['entry-9']);
  });
});
