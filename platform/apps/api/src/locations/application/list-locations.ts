// ListLocations — queries адмінки і сайту. list() — всі точки (список §1.1),
// listActive() — лише активні (сайт/web-screens §1–2, вимкнені ховаються).

import type { Location } from '../domain/location';
import type { LocationRepository } from '../domain/ports';
import { LocationNotFoundError } from './locations-errors';

export class ListLocationsHandler {
  constructor(private readonly locations: LocationRepository) {}

  list(): Promise<Location[]> {
    return this.locations.list();
  }

  listActive(): Promise<Location[]> {
    return this.locations.listActive();
  }

  async findById(id: string): Promise<Location> {
    const location = await this.locations.findById(id);
    if (!location) throw new LocationNotFoundError();
    return location;
  }
}
