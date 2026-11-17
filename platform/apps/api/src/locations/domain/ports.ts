// Порти context locations — контракти, які домен вимагає від інфраструктури.
// Напрям залежностей: infrastructure → application → domain.

import type { DomainEvent } from './location.events';
import type { Location } from './location';
import type { LocationLogo } from './location-logo';
import type { StaffAssignment } from './staff-assignment';

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  id(): string;
}

export interface LocationRepository {
  findById(id: string): Promise<Location | null>;
  findByCode(code: string): Promise<Location | null>;
  save(location: Location): Promise<void>;
  list(): Promise<Location[]>;
  listActive(): Promise<Location[]>;
}

export interface StaffAssignmentRepository {
  findById(id: string): Promise<StaffAssignment | null>;
  findByBarberAndLocation(barberId: string, locationId: string): Promise<StaffAssignment | null>;
  save(assignment: StaffAssignment): Promise<void>;
  delete(id: string): Promise<void>;
  listByLocation(locationId: string): Promise<StaffAssignment[]>;
  listByBarber(barberId: string): Promise<StaffAssignment[]>;
}

export interface Outbox {
  append(events: readonly DomainEvent[]): Promise<void>;
}

/** Один логотип на локацію (T-4609a); ключі — бакет location-brand. */
export interface LocationLogoRepository {
  findByLocationId(locationId: string): Promise<LocationLogo | null>;
  /** Один запит для публічного списку — без N+1. */
  listByLocationIds(locationIds: string[]): Promise<LocationLogo[]>;
  save(logo: LocationLogo): Promise<void>;
  delete(locationId: string): Promise<void>;
}

/** Місто клієнта за координатами (адміністративна одиниця для фільтра). */
export interface CityInfo {
  city: string;
}

/** Зворотне геокодування (координати → місто). Реалізація — зовнішній
 * сервіс (Nominatim); помилка/таймаут не мають ламати список локацій. */
export interface Geocoder {
  reverseGeocode(lat: number, lng: number): Promise<CityInfo | null>;
}

export interface UnitOfWork {
  run<T>(work: () => Promise<T>): Promise<T>;
}
