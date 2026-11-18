import type { BarberSchedule } from '../../scheduling/domain/availability';
import type { OpeningHours } from '../../locations/domain/opening-hours';
import { AnyBarberAvailability } from '../../scheduling/domain/any-barber-availability';
import { SlotValidator, type TimeSlotData } from '../../scheduling/domain/slot-validator';
import type { PrismaBookingRepository } from '../../scheduling/infrastructure/prisma-booking.repository';
import type { PrismaAvailabilityRepository } from '../../scheduling/infrastructure/prisma-availability.repository';
import type { PrismaLocationRepository } from '../../locations/infrastructure/prisma-location.repository';
import type { PrismaServiceRepository } from '../../catalog/infrastructure/prisma-service.repository';
import type { PrismaUserRepository } from '../../identity/infrastructure/prisma-adapters';
import type { BarberServiceAssignmentRepository } from '../../scheduling/domain/ports.barber-service-assignment';
import {
  barbersForService,
  type BarberServiceMatrix,
} from '../../scheduling/domain/barber-service-matrix';
import type { SlotPolicyRepository } from '../../scheduling/domain/ports.slot-policy';
import type { Clock } from '../../locations/domain/ports';

export interface AvailableSlotsDeps {
  bookingRepo: PrismaBookingRepository;
  scheduleRepo: PrismaAvailabilityRepository;
  locationRepo: PrismaLocationRepository;
  userRepo: PrismaUserRepository;
  serviceRepo: PrismaServiceRepository;
  assignmentRepo: BarberServiceAssignmentRepository;
  slotPolicyRepo: SlotPolicyRepository;
  /** Годинник для політик горизонту/last-minute (T-4522); у тестах — фейк. */
  clock: Clock;
}

export interface SlotContext {
  barberId: string | undefined;
  selectedSchedule: BarberSchedule | null;
  allSchedules: BarberSchedule[];
  locationId: string;
  activeBarberIds: Set<string>;
  opening: OpeningHours;
  duration: number;
  /** Снепшот матриці: { barberId: { locationId: Set<serviceId> } } (T-4521). */
  assignmentMatrix: BarberServiceMatrix;
  /** Ідентифікатор обраної послуги — використовується для фільтру матриці (T-4522). */
  serviceId: string;
}

export function candidates(ctx: SlotContext, slot: TimeSlotData): string[] {
  const allowed = serviceBarbers(ctx);
  if (!ctx.barberId) {
    // T-4521: фільтруємо барберів матрицею — якщо для обраної
    // послуги барбер не завіває, він не потрапляє в available (а не тільки disabled).
    const anyAgg = AnyBarberAvailability.reconstitute(ctx.locationId, ctx.allSchedules);
    return anyAgg
      .findAvailableBarbers(slot, ctx.opening, ctx.duration)
      .filter((id) => allowed.has(id));
  }
  if (!ctx.activeBarberIds.has(ctx.barberId) || !ctx.selectedSchedule) return [];
  // Якщо барбер обраний явно — перевіряємо, чи він взагалі завіває цю послугу.
  if (!allowed.has(ctx.barberId)) return [];
  try {
    new SlotValidator(ctx.selectedSchedule, ctx.opening, ctx.duration).validate(slot);
    return [ctx.barberId];
  } catch {
    return []; // invalid → no barbers
  }
}

/** Барбери, які завівають послугу локації за контекстом; без матриці — fallback. */
function serviceBarbers(ctx: SlotContext): Set<string> {
  return barbersForService(
    ctx.assignmentMatrix,
    { locationId: ctx.locationId, serviceId: ctx.serviceId },
    ctx.activeBarberIds
  );
}
