// UpdateLocation — оновлення профілю, годин, крісел, каналів зв'язку і
// галереї (MNG-ADM-01/03/04). Часткове оновлення: поля, яких немає в input,
// не змінюються. Канали/фото замінюються целиком (адмінка шле повний список).

import type { AddressProps } from '../domain/address';
import { Location } from '../domain/location';
import type { DayHours } from '../domain/opening-hours';
import type { ChairData } from '../domain/chair';
import type { Clock, LocationRepository, Outbox, UnitOfWork } from '../domain/ports';
import { LocationNotFoundError } from './locations-errors';
import { applyLocationChanges, locationUpdateEvents } from './update-location-apply';

export interface UpdateLocationInput {
  id: string;
  name?: string;
  address?: string;
  addressParts?: AddressProps | undefined;
  lat?: number;
  lng?: number;
  phone?: string | null;
  email?: string | null;
  hours?: DayHours[];
  chairs?: ChairData[];
  channels?: { channel: string; value: string; sortOrder?: number }[];
  photos?: { url: string; caption?: string | null; sortOrder?: number }[];
  active?: boolean;
}

export interface UpdateLocationDeps {
  locations: LocationRepository;
  outbox: Outbox;
  clock: Clock;
  uow: UnitOfWork;
}

export class UpdateLocationHandler {
  constructor(private readonly deps: UpdateLocationDeps) {}

  async handle(input: UpdateLocationInput): Promise<{ id: string }> {
    const { locations, outbox, clock, uow } = this.deps;
    return uow.run(async () => {
      const location = await this.findOrThrow(input.id);
      if (applyLocationChanges(location, input)) {
        await locations.save(location);
        await outbox.append(locationUpdateEvents(location, input, clock.now()));
      }
      return { id: location.id };
    });
  }

  private async findOrThrow(id: string): Promise<Location> {
    const location = await this.deps.locations.findById(id);
    if (!location) throw new LocationNotFoundError();
    return location;
  }
}
