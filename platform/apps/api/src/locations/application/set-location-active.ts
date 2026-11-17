// DisableLocation — команда вимкнення точки (MNG-ADM-02). Вимкнена локація
// зникає з сайту і флоу запису негайно; існуючі візити не скасовуються.
// Ідемпотентна: повторне вимкнення не породжує подію.

import { Clock, LocationRepository, Outbox, UnitOfWork } from '../domain/ports';
import { LocationDisabled, LocationEnabled } from '../domain/location.events';
import { LocationNotFoundError } from './locations-errors';

export interface SetLocationActiveDeps {
  locations: LocationRepository;
  outbox: Outbox;
  clock: Clock;
  uow: UnitOfWork;
}

export class DisableLocationHandler {
  constructor(private readonly deps: SetLocationActiveDeps) {}

  async handle(id: string): Promise<{ id: string }> {
    const { locations, outbox, clock, uow } = this.deps;
    return uow.run(async () => {
      const location = await locations.findById(id);
      if (!location) throw new LocationNotFoundError();
      if (!location.setActive(false)) return { id };
      await locations.save(location);
      await outbox.append([new LocationDisabled(location.id, clock.now())]);
      return { id: location.id };
    });
  }
}

export class EnableLocationHandler {
  constructor(private readonly deps: SetLocationActiveDeps) {}

  async handle(id: string): Promise<{ id: string }> {
    const { locations, outbox, clock, uow } = this.deps;
    return uow.run(async () => {
      const location = await locations.findById(id);
      if (!location) throw new LocationNotFoundError();
      if (!location.setActive(true)) return { id };
      await locations.save(location);
      await outbox.append([new LocationEnabled(location.id, clock.now())]);
      return { id: location.id };
    });
  }
}
