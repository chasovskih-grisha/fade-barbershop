/* eslint-disable max-lines -- T-4616a: one cohesive per-visit resolution flow; the two decisions share the same transaction/idempotency guards. */
// T-4616a: рішення по одному візиту. Reassign проходить ті самі перевірки
// слота/крісла, що й звичайний RescheduleAppointment (через нього ж), а cancel
// іде через життєвий цикл Appointment. Конфлікт закривається в тій самій
// транзакції, що й зміна візиту; повторний виклик для closed — no-op.
import { barbersForService } from '../domain/barber-service-matrix';
import { InvalidSlotError } from '../domain/slot-validator';
import { canReassignConflict, type ShiftConflictData } from '../domain/barber-unavailability';
import type {
  BarberUnavailabilityRepository,
  ShiftConflictRepository,
} from '../domain/shift-conflict-ports';
import type { BarberServiceAssignmentRepository } from '../domain/ports.barber-service-assignment';
import { isDayOff, type DayOffRepository } from '../domain/day-off';
import type { UnitOfWork } from '../../locations/domain/ports';
import type { RescheduleCommand } from './reschedule-appointment.types';

export interface ResolveShiftConflictDeps {
  conflicts: ShiftConflictRepository;
  barberServices: Pick<BarberServiceAssignmentRepository, 'snapshotForLocation'>;
  /** T-4616a: reassignment must not land inside an unavailability interval. */
  unavailabilities: Pick<BarberUnavailabilityRepository, 'covers'>;
  /** Leave/day-off is optional until its durable adapter is wired. */
  dayOffs?: DayOffRepository;
  reschedule: { handle(cmd: RescheduleCommand): Promise<void> };
  cancel: {
    cancel(cmd: {
      appointmentId: string;
      actorId: string;
      actorRole: 'admin';
      reason?: string;
    }): Promise<void>;
  };
  uow: UnitOfWork;
  clock: { now(): Date };
}

export type ResolveShiftConflictCommand =
  | { conflictId: string; actorId: string; decision: 'cancel' }
  | {
      conflictId: string;
      actorId: string;
      decision: 'reassign';
      barberId: string;
      date: string;
      start: string;
      end: string;
    };

export interface ResolveShiftConflictResult {
  conflict: ShiftConflictData;
  changed: boolean;
  /**
   * T-4616a: візити, які справді скасовано цим рішенням (для партії — всі
   * ноги). Гроші за ними закриває виклик: refund і звільнення крісла не
   * живуть у домені календаря.
   */
  cancelledBookingIds?: string[];
}

export type ResolveManyOutcome =
  | {
      conflictId: string;
      status: 'resolved';
      changed: boolean;
      /** T-4616b: візити, скасовані цим рішенням — за ними йде settlement. */
      cancelledBookingIds?: string[];
    }
  | { conflictId: string; status: 'failed'; error: string };

export class ResolveShiftConflict {
  constructor(private readonly deps: ResolveShiftConflictDeps) {}

  async execute(cmd: ResolveShiftConflictCommand): Promise<ResolveShiftConflictResult> {
    return this.deps.uow.run(async () => {
      const conflict = await this.deps.conflicts.findById(cmd.conflictId);
      if (!conflict) throw new Error(`Shift conflict ${cmd.conflictId} not found`);
      if (!canReassignConflict(conflict)) return { conflict, changed: false };

      if (cmd.decision === 'cancel') {
        const cancelledBookingIds = await this.cancel(conflict, cmd.actorId);
        const closed = await this.close(conflict, {
          resolution: 'cancelled',
          at: this.deps.clock.now(),
        });
        return { conflict: closed, changed: true, cancelledBookingIds };
      }

      if (conflict.partyId) {
        throw InvalidSlotError.of(
          'Party conflict must be resolved as a whole; per-leg reassignment is not allowed'
        );
      }
      await this.assertQualified(conflict, cmd.barberId);
      await this.assertAvailable(conflict, cmd);
      await this.deps.reschedule.handle({
        appointmentId: conflict.appointmentId,
        actorId: cmd.actorId,
        actorRole: 'admin',
        barberId: cmd.barberId,
        date: cmd.date,
        start: cmd.start,
        end: cmd.end,
      });
      const closed = await this.close(conflict, {
        resolution: 'reassigned',
        resolvedBarberId: cmd.barberId,
        at: this.deps.clock.now(),
      });
      return { conflict: closed, changed: true };
    });
  }

  /** Кожен візит — окрема транзакція; збій одного не відкочує інші. */
  async executeMany(cmds: ResolveShiftConflictCommand[]): Promise<ResolveManyOutcome[]> {
    const outcomes: ResolveManyOutcome[] = [];
    for (const cmd of cmds) {
      try {
        const result = await this.execute(cmd);
        outcomes.push({
          conflictId: cmd.conflictId,
          status: 'resolved',
          changed: result.changed,
          ...(result.cancelledBookingIds?.length
            ? { cancelledBookingIds: result.cancelledBookingIds }
            : {}),
        });
      } catch (error) {
        outcomes.push({
          conflictId: cmd.conflictId,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return outcomes;
  }

  private async assertQualified(conflict: ShiftConflictData, barberId: string): Promise<void> {
    if (!conflict.serviceId) return;
    const { matrix } = await this.deps.barberServices.snapshotForLocation(conflict.locationId);
    const qualified = barbersForService(
      matrix,
      { locationId: conflict.locationId, serviceId: conflict.serviceId },
      [barberId]
    );
    if (!qualified.has(barberId)) {
      throw InvalidSlotError.of('Barber does not perform this service');
    }
  }

  /** Скасування партії — лише всі ноги разом; часткове скасування заборонене. */
  private async cancel(conflict: ShiftConflictData, actorId: string): Promise<string[]> {
    if (!conflict.partyId) {
      await this.deps.cancel.cancel({
        appointmentId: conflict.appointmentId,
        actorId,
        actorRole: 'admin',
        reason: 'barber unavailable',
      });
      return [conflict.bookingId];
    }
    const bookingIds = await this.deps.conflicts.bookingIdsForParty(conflict.partyId);
    if (bookingIds.length < 2) {
      throw new Error(`Party conflict ${conflict.id} does not have both legs`);
    }
    for (const appointmentId of bookingIds) {
      await this.deps.cancel.cancel({
        appointmentId,
        actorId,
        actorRole: 'admin',
        reason: 'barber unavailable',
      });
    }
    return bookingIds;
  }

  /** Візит не можна перепризначити на барбера, який недоступний у цьому слоті. */
  private async assertAvailable(
    conflict: ShiftConflictData,
    cmd: { barberId: string; date: string; start: string; end: string }
  ): Promise<void> {
    const start = new Date(`${cmd.date}T${cmd.start}:00.000Z`);
    const end = new Date(`${cmd.date}T${cmd.end}:00.000Z`);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
      throw InvalidSlotError.of('A valid reassignment slot is required');
    }
    if (
      await this.deps.unavailabilities.covers({
        barberId: cmd.barberId,
        locationId: conflict.locationId,
        start,
        end,
      })
    ) {
      throw InvalidSlotError.of('Barber is unavailable for this slot');
    }
    if (this.deps.dayOffs) {
      const dayOffs = await this.deps.dayOffs.findByBarberId(cmd.barberId);
      if (isDayOff(dayOffs, cmd.date)) {
        throw InvalidSlotError.of('Barber is on leave for this date');
      }
    }
  }

  private async close(
    conflict: ShiftConflictData,
    input: {
      resolution: 'reassigned' | 'cancelled';
      resolvedBarberId?: string;
      at: Date;
    }
  ): Promise<ShiftConflictData> {
    const closed = await this.deps.conflicts.close(conflict.id, input);
    if (!closed) throw new Error(`Shift conflict ${conflict.id} was already closed`);
    return closed;
  }
}
