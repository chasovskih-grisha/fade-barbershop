// T-4616a: окремий запит списку відкритих конфліктів. Для кожного візиту
// показуємо клієнта, послугу, час і чи є інший кваліфікований барбер.
import type { ShiftConflictData } from '../domain/barber-unavailability';
import type {
  ShiftConflictAvailability,
  ShiftConflictRepository,
} from '../domain/shift-conflict-ports';

export interface ShiftConflictView {
  id: string;
  appointmentId: string;
  bookingId: string;
  partyId: string | null;
  barberId: string;
  locationId: string;
  clientId: string | null;
  serviceId: string | null;
  start: Date;
  end: Date;
  otherBarberAvailable: boolean;
}

export interface ListShiftConflictsDeps {
  conflicts: ShiftConflictRepository;
  availability: ShiftConflictAvailability;
}

export class ListShiftConflicts {
  constructor(private readonly deps: ListShiftConflictsDeps) {}

  async execute(
    filter: { barberId?: string; locationId?: string } = {}
  ): Promise<ShiftConflictView[]> {
    const conflicts = await this.deps.conflicts.listOpen(filter);
    return Promise.all(
      conflicts.map(async (conflict) => ({
        ...toView(conflict),
        otherBarberAvailable: await this.deps.availability.hasOtherBarber(conflict),
      }))
    );
  }
}

function toView(conflict: ShiftConflictData): Omit<ShiftConflictView, 'otherBarberAvailable'> {
  return {
    id: conflict.id,
    appointmentId: conflict.appointmentId,
    bookingId: conflict.bookingId,
    partyId: conflict.partyId,
    barberId: conflict.barberId,
    locationId: conflict.locationId,
    clientId: conflict.clientId,
    serviceId: conflict.serviceId,
    start: conflict.start,
    end: conflict.end,
  };
}
