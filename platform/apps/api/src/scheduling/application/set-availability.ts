import { BarberSchedule, AvailabilityWindowData } from '../domain/availability';
import { AvailabilityChanged } from '../domain/availability.events';
import type { Outbox, UnitOfWork, LocationRepository } from '../../locations/domain/ports';
import type { AvailabilityRepository } from '../domain/ports';
import type { BookingRepository } from '../domain/booking-repository';
import { LocationNotFoundError } from '../../locations/application/locations-errors';
import { validateAvailability } from './availability-validation';
import { InvalidScheduleInputError } from '../domain/availability';

/**
 * Депенденсі інжекція для SetAvailabilityHandler.
 */
export interface SetAvailabilityDeps {
  scheduleRepo: AvailabilityRepository;
  locations: LocationRepository;
  bookings: Pick<BookingRepository, 'findForBarberAtLocation'>;
  outbox: Outbox;
  uow: UnitOfWork;
}

/**
 * Use‑case: встановити (або оновити) графік барбера у локації.
 */
export class SetAvailabilityHandler {
  constructor(private readonly deps: SetAvailabilityDeps) {}

  async handle(params: {
    barberId: string;
    locationId: string;
    windows: AvailabilityWindowData[];
  }): Promise<{ version: number }> {
    const { barberId, locationId, windows } = params;
    if (
      typeof barberId !== 'string' ||
      !barberId.trim() ||
      typeof locationId !== 'string' ||
      !locationId.trim()
    ) {
      throw new InvalidScheduleInputError('Barber ID and Location ID required');
    }
    if (!Array.isArray(windows)) throw new InvalidScheduleInputError('windows must be an array');
    return this.deps.uow.run(async () => {
      const location = await this.deps.locations.findById(locationId);
      if (!location || !location.active) throw new LocationNotFoundError();
      validateAvailability(
        windows,
        location.hours,
        await this.deps.bookings.findForBarberAtLocation(barberId, locationId)
      );
      const previous = await this.deps.scheduleRepo.findByBarberAndLocation(barberId, locationId);
      const schedule = BarberSchedule.create({
        barberId,
        locationId,
        windows,
        version: previous ? previous.getVersion() + 1 : 0,
      });
      await this.deps.scheduleRepo.save(schedule);
      // Emit event
      const event = new AvailabilityChanged({
        barberId,
        locationId,
        windows,
        version: schedule.getVersion(),
      });
      await this.deps.outbox.append([event]);
      return { version: schedule.getVersion() };
    });
  }
}

/**
 * Депенденсі інжекція для ListAvailabilityHandler.
 */
export interface ListAvailabilityDeps {
  scheduleRepo: any; // AvailabilityRepository
}

/**
 * Use‑case: список графіків (можна фільтрувати, спрощено — лише один графік за barber+location).
 */
export class ListAvailabilityHandler {
  constructor(private readonly deps: ListAvailabilityDeps) {}

  async listByBarberAndLocation(
    barberId: string,
    locationId: string
  ): Promise<BarberSchedule | null> {
    return this.deps.scheduleRepo.findByBarberAndLocation(barberId, locationId);
  }
}
