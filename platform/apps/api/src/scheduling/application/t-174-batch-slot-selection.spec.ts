/* eslint-disable max-lines -- cohesive module (129 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Специфікація T-174: пакетний підбір слотів для групи та групове бронювання.
// Use case перевіряється з in-memory портами — без Prisma і без HTTP, рівно те,
// що обіцяє задача: підбір до groupSize слотів і створення рівно groupSize записів.
import type { ClientRepository } from '../../clients/domain/repositories';
import type { AppointmentRecord, AppointmentRepository } from '../domain/repositories';
import type { AvailableSlot, SlotSearchCriteria, WaitlistQueue } from '../domain/waitlist-queue';
import { T174BatchSlotSelectionUseCase } from './t-174-batch-slot-selection.use-case';

const SLOTS: AvailableSlot[] = [
  { id: 'slot-1', barberId: 'barber-1', serviceId: 'svc-1', startTime: '2026-11-20T10:00:00.000Z' },
  { id: 'slot-2', barberId: 'barber-1', serviceId: 'svc-1', startTime: '2026-11-20T10:30:00.000Z' },
  { id: 'slot-3', barberId: 'barber-1', serviceId: 'svc-1', startTime: '2026-11-20T11:00:00.000Z' },
];

function harness(options: { slots?: AvailableSlot[]; knownClient?: boolean } = {}) {
  const created: AppointmentRecord[] = [];
  const calls: SlotSearchCriteria[] = [];

  const waitlistQueue = {
    getAvailableSlots: jest.fn(async (criteria: SlotSearchCriteria) => {
      calls.push(criteria);
      return options.slots ?? SLOTS;
    }),
  } as unknown as WaitlistQueue;

  const clientRepo = {
    getById: jest.fn(async (id: string) =>
      options.knownClient === false ? null : { id, name: 'Олена', visitCount: 3 }
    ),
    getNoShowHistory: jest.fn(async () => []),
  } as unknown as ClientRepository;

  const appointmentRepo = {
    create: jest.fn(async (record: AppointmentRecord) => {
      created.push(record);
    }),
    findMany: jest.fn(async () => created),
  } as unknown as AppointmentRepository;

  return {
    useCase: new T174BatchSlotSelectionUseCase(appointmentRepo, waitlistQueue, clientRepo),
    created,
    calls,
    waitlistQueue,
    clientRepo,
    appointmentRepo,
  };
}

describe('T174BatchSlotSelectionUseCase', () => {
  it('picks one slot per group member and reports the estimated price', async () => {
    const { useCase, calls } = harness();

    const result = await useCase.findBatchSlots({
      clientId: 'client-1',
      preferredServices: ['service-cut'],
      groupSize: 2,
      preferredDate: '2026-11-20',
      fallbackEnabled: true,
    });

    expect(result.success).toBe(true);
    expect(result.selectedSlots).toHaveLength(2);
    expect(result.selectedSlots.map((slot) => slot.slotId)).toEqual(['slot-1', 'slot-2']);
    expect(result.selectedSlots[0]).toMatchObject({
      barberId: 'barber-1',
      serviceId: 'service-cut',
    });
    expect(result.totalEstimatedPrice).toBe(200);
    expect(result.rejectedReasons).toBeUndefined();
    expect(calls[0]).toEqual({
      serviceIds: ['service-cut'],
      groupSize: 2,
      preferredDate: '2026-11-20',
    });
  });

  it('reports the shortfall when fewer slots exist than the group size', async () => {
    const { useCase } = harness({ slots: SLOTS.slice(0, 2) });

    const result = await useCase.findBatchSlots({
      clientId: 'client-1',
      preferredServices: ['service-cut'],
      groupSize: 3,
      fallbackEnabled: true,
    });

    expect(result.success).toBe(true);
    expect(result.selectedSlots).toHaveLength(2);
    expect(result.rejectedReasons).toEqual(['Not all group members could be accommodated']);
  });

  it('fails clearly when no slots match', async () => {
    const { useCase } = harness({ slots: [] });

    const result = await useCase.findBatchSlots({
      clientId: 'client-1',
      preferredServices: ['service-cut'],
      groupSize: 2,
      fallbackEnabled: true,
    });

    expect(result).toEqual({
      success: false,
      selectedSlots: [],
      rejectedReasons: ['No available slots matching criteria'],
      totalEstimatedPrice: 0,
    });
  });

  it('fails clearly when the client does not exist', async () => {
    const { useCase, waitlistQueue } = harness({ knownClient: false });

    const result = await useCase.findBatchSlots({
      clientId: 'ghost',
      preferredServices: ['service-cut'],
      groupSize: 1,
      fallbackEnabled: true,
    });

    expect(result.success).toBe(false);
    expect(result.rejectedReasons).toEqual(['Client not found']);
    expect(waitlistQueue.getAvailableSlots).not.toHaveBeenCalled();
  });

  it('creates one booking per group member with the waitlist group source', async () => {
    const { useCase, created } = harness();

    const result = await useCase.createGroupBooking({
      clientId: 'client-1',
      assignedBarberId: 'barber-1',
      serviceId: 'service-cut',
      slotId: 'slot-1',
      groupSize: 3,
      notes: 'День народження',
    });

    expect(result.success).toBe(true);
    expect(result.bookingIds).toHaveLength(3);
    expect(created).toHaveLength(3);
    for (const record of created) {
      expect(record).toMatchObject({
        clientId: 'client-1',
        barberId: 'barber-1',
        serviceId: 'service-cut',
        status: 'booked',
        source: 'waitlist_group',
        notes: 'День народження',
      });
    }
    expect(result.summary).toContain('3');
  });
});
