// CreateLocation — команда відкриття точки (MNG-ADM-01). Унікальність коду
// перевіряється на сервері (адмінка показує «Код уже зайнятий» біля поля).

import type { AddressProps } from '../domain/address';
import { Location } from '../domain/location';
import { Coordinates } from '../domain/coordinates';
import { OpeningHours } from '../domain/opening-hours';
import { LocationOpened, ChairAdded } from '../domain/location.events';
import type { DayHours } from '../domain/opening-hours';
import type { Clock, IdGenerator, LocationRepository, Outbox, UnitOfWork } from '../domain/ports';
import { InvalidLocationInputError, LocationCodeTakenError } from './locations-errors';

export interface CreateLocationInput {
  code: string;
  name: string;
  address: string;
  addressParts?: AddressProps | undefined;
  lat: number;
  lng: number;
  phone?: string | null;
  email?: string | null;
  hours: DayHours[];
}

export interface CreateLocationDeps {
  locations: LocationRepository;
  outbox: Outbox;
  clock: Clock;
  ids: IdGenerator;
  uow: UnitOfWork;
}

export class CreateLocationHandler {
  constructor(private readonly deps: CreateLocationDeps) {}

  async handle(input: CreateLocationInput): Promise<{ id: string }> {
    const { locations, outbox, clock, ids, uow } = this.deps;
    return uow.run(async () => {
      const code = input.code.trim().toUpperCase();
      const existing = await locations.findByCode(code);
      if (existing) throw new LocationCodeTakenError();

      const now = clock.now();
      let created: Location;
      try {
        created = Location.create({
          id: ids.id(),
          code,
          name: input.name,
          address: input.address,
          addressParts: input.addressParts,
          coordinates: Coordinates.of(input.lat, input.lng),
          phone: input.phone ?? null,
          email: input.email ?? null,
          hours: OpeningHours.of(input.hours),
          createdAt: now,
        });
      } catch (error) {
        throw new InvalidLocationInputError((error as Error).message);
      }

      await locations.save(created);
      const events = [
        new LocationOpened(created.id, created.code, now),
        ...created.chairs.map((chair) => new ChairAdded(created.id, chair.number, now)),
      ];
      await outbox.append(events);
      return { id: created.id };
    });
  }
}
