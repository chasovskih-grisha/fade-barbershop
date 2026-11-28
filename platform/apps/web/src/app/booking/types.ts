export interface LocationDto {
  id: string;
  name: string;
  address: string;
  /** Кількість крісел; nearest-відповідь її не віддає. */
  chairs?: number;
}

/** Відповідь GET /locations/nearest (публічний API locations). */
export interface NearestLocationsResponse {
  /** Місто клієнта (зворотне геокодування); null — не розпізнано. */
  city: string | null;
  /** true — список відсортовано за відстанню. */
  sortedByDistance: boolean;
  locations: NearestLocationDto[];
}

export interface NearestLocationDto {
  id: string;
  code: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  /** Відстань у км; null — клієнт не поділився геолокацією. */
  distanceKm: number | null;
}

/** Канал зв'язку локації (детальна сторінка, web-screens §2). */
export interface ChannelDto {
  channel: string;
  value: string;
  sortOrder: number;
}

/** Фото галереї локації. */
export interface PhotoDto {
  url: string;
  caption: string | null;
  sortOrder: number;
}

/** День тижня розкладу. */
export interface DayHoursDto {
  dayOfWeek: number;
  open: string | null;
  close: string | null;
  closed: boolean;
}

/** Відповідь GET /locations/{code} (детальна сторінка). */
export interface LocationDetailsDto {
  id: string;
  code: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  email: string | null;
  active: boolean;
  channels: ChannelDto[];
  photos: PhotoDto[];
  hours: DayHoursDto[];
}

export interface ServiceDto {
  id: string;
  name: string;
  duration: number; // minutes
  price: number;
  /** Пакет із двома ногами (T-4521c): тривалість parallel-режиму, інакше null. */
  parallelDuration?: number | null;
}

export interface BarberPhotoDto {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

export interface BarberDto {
  id: string;
  name: string;
  any?: boolean;
  photo?: BarberPhotoDto | null;
  locationName?: string;
}

export interface AvailableSlotDto {
  start: string; // HH:mm
  end: string; // HH:mm
  barbers: string[];
}

// UI library slot type (imported elsewhere)
export interface Slot {
  id: string;
  time: string;
  state: string;
}
