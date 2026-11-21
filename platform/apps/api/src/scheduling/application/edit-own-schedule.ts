// Use-case: барбер редагує власний графік за політикою доступу (T-230).
// Той самий агрегат `Availability`, що й адмінка, — self-service лише додає
// другий письменник: перевірку прапорця, жорсткі години локації та блокування
// збереження при конфліктах із заброньованими візитами (SCH-004), без права
// їх переносити. Кожна успішна зміна пише журнал і `AvailabilityChanged`.

import { BarberSchedule, type AvailabilityWindowData } from '../domain/availability';
import { AvailabilityChanged } from '../domain/availability.events';
import {
  assertScheduleEditAllowed,
  assertWindowsWithinOpeningHours,
  type ScheduleEditor,
} from '../domain/barber-self-service';
import { findScheduleConflicts, type ScheduleConflict } from '../domain/schedule-conflicts';
import { recordScheduleChange } from '../domain/schedule-change-log';
import { validateWindowShape } from './availability-validation';
import { InvalidScheduleInputError } from '../domain/availability';
import type { BookingRepository } from '../domain/booking-repository';
import type {
  AvailabilityRepository,
  ScheduleChangeLogRepository,
  SchedulePolicyRepository,
} from '../domain/ports';
import type { LocationRepository, Outbox, UnitOfWork } from '../../locations/domain/ports';
import { LocationNotFoundError } from '../../locations/application/locations-errors';

export interface EditOwnScheduleDeps {
  scheduleRepo: AvailabilityRepository;
  policies: SchedulePolicyRepository;
  changeLog: ScheduleChangeLogRepository;
  locations: LocationRepository;
  bookings: Pick<BookingRepository, 'findForBarberAtLocation'>;
  outbox: Outbox;
  uow: UnitOfWork;
}

export interface EditOwnScheduleCommand {
  barberId: string;
  locationId: string;
  windows: AvailabilityWindowData[];
  editor: ScheduleEditor;
  /** Автор зміни для журналу (SCH-006): id барбера або адміна. */
  changedBy: string;
}

export type EditOwnScheduleResult =
  { status: 'saved'; version: number } | { status: 'blocked'; conflicts: ScheduleConflict[] };

export class EditOwnScheduleHandler {
  constructor(private readonly deps: EditOwnScheduleDeps) {}

  async handle(command: EditOwnScheduleCommand): Promise<EditOwnScheduleResult> {
    const { barberId, locationId, windows } = command;
    if (!barberId.trim() || !locationId.trim()) {
      throw new InvalidScheduleInputError('Barber ID and Location ID required');
    }
    if (!Array.isArray(windows)) throw new InvalidScheduleInputError('windows must be an array');
    return this.deps.uow.run(() => this.apply(command));
  }

  private async apply(command: EditOwnScheduleCommand): Promise<EditOwnScheduleResult> {
    const { barberId, locationId, windows, editor } = command;
    const location = await this.deps.locations.findById(locationId);
    if (!location || !location.active) throw new LocationNotFoundError();
    const policy = (await this.deps.policies.findForBarber(barberId)) ?? {
      selfService: false,
      allowOutsideHours: false,
    };
    const gate: ScheduleEditor = { policy, source: editor.source };
    assertScheduleEditAllowed(gate);
    validateWindowShape(windows);
    assertWindowsWithinOpeningHours(windows, location.hours, gate);
    const bookings = await this.deps.bookings.findForBarberAtLocation(barberId, locationId);
    const conflicts = findScheduleConflicts(windows, bookings);
    if (conflicts.length > 0) return { status: 'blocked', conflicts };
    return { status: 'saved', ...(await this.persist(command)) };
  }

  private async persist(command: EditOwnScheduleCommand): Promise<{ version: number }> {
    const { barberId, locationId, windows, editor, changedBy } = command;
    const previous = await this.deps.scheduleRepo.findByBarberAndLocation(barberId, locationId);
    const schedule = BarberSchedule.create({
      barberId,
      locationId,
      windows,
      version: previous ? previous.getVersion() + 1 : 0,
    });
    await this.deps.scheduleRepo.save(schedule);
    await this.deps.changeLog.append(
      recordScheduleChange({
        barberId,
        locationId,
        source: editor.source,
        changedBy,
        previous: previous?.getWindows() ?? [],
        next: windows,
      })
    );
    await this.deps.outbox.append([
      new AvailabilityChanged({
        barberId,
        locationId,
        windows,
        version: schedule.getVersion(),
        source: editor.source,
      }),
    ]);
    return { version: schedule.getVersion() };
  }
}
