// GetLocationDetails — публічні дані сторінки локації (web-screens §2):
// профіль, години, канали зв'язку, галерея. Вимкнена локація недоступна для
// запису (MNG-ADM-02), але за прямим URL повертається з active=false, щоб
// сторінка показала явний стан «не приймає записів» з CTA на інші локації
// (T-4513, ux-guidelines §1), а не 404: 404 плутає гостя й пошуковик.

import type { Location } from '../domain/location';
import type { LocationRepository } from '../domain/ports';
import { LocationNotFoundError } from './locations-errors';

export interface LocationDetails {
  readonly location: Location;
  /** Публічний бекдор: локація існує, але вимкнена адміністратором. */
  readonly inactive: boolean;
}

export class GetLocationDetailsHandler {
  constructor(private readonly locations: LocationRepository) {}

  async handle(code: string): Promise<LocationDetails> {
    const normalized = code.trim().toUpperCase();
    const location = await this.locations.findByCode(normalized);
    if (!location) throw new LocationNotFoundError();
    return { location, inactive: !location.active };
  }
}
