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
  /** Ім'я клієнта для рядка рішення; null — імені немає, показуємо лише час. */
  clientName: string | null;
  serviceName: string | null;
  start: Date;
  end: Date;
  otherBarberAvailable: boolean;
}

/** Імена для рядка конфлікту — вони живуть в інших агрегатах (identity/services). */
export interface ShiftConflictNames {
  clientName(clientId: string | null): Promise<string | null>;
  serviceName(serviceId: string | null): Promise<string | null>;
}

export interface ListShiftConflictsDeps {
  conflicts: ShiftConflictRepository;
  availability: ShiftConflictAvailability;
  names: ShiftConflictNames;
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
        clientName: await this.deps.names.clientName(conflict.clientId),
        serviceName: await this.deps.names.serviceName(conflict.serviceId),
        otherBarberAvailable: await this.deps.availability.hasOtherBarber(conflict),
      }))
    );
  }
}

function toView(
  conflict: ShiftConflictData
): Omit<ShiftConflictView, 'clientName' | 'serviceName' | 'otherBarberAvailable'> {
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
