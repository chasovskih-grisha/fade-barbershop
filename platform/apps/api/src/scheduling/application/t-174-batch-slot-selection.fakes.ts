// Харнес T-174: in-memory порти для пакетного підбору слотів і групового бронювання.
import type { ClientRepository } from '../../clients/domain/repositories';
import type { AppointmentRecord, AppointmentRepository } from '../domain/repositories';
import type { AvailableSlot, SlotSearchCriteria, WaitlistQueue } from '../domain/waitlist-queue';
import { T174BatchSlotSelectionUseCase } from './t-174-batch-slot-selection.use-case';

export const SLOTS: AvailableSlot[] = [
  { id: 'slot-1', barberId: 'barber-1', serviceId: 'svc-1', startTime: '2026-11-20T10:00:00.000Z' },
  { id: 'slot-2', barberId: 'barber-1', serviceId: 'svc-1', startTime: '2026-11-20T10:30:00.000Z' },
  { id: 'slot-3', barberId: 'barber-1', serviceId: 'svc-1', startTime: '2026-11-20T11:00:00.000Z' },
];

export function harness(options: { slots?: AvailableSlot[]; knownClient?: boolean } = {}) {
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
