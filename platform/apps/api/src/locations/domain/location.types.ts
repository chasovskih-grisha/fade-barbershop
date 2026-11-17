import type { Address, AddressProps } from './address';
import type { Coordinates } from './coordinates';
import type { OpeningHours } from './opening-hours';
import type { Chair } from './chair';
import type { ChannelData } from './location-channel';
import type { PhotoData } from './location-photo';

export interface LocationData {
  id: string;
  code: string;
  name: string;
  address: string;
  /** Структурована адреса; null — legacy-рядок, ще не підтверджений адміном. */
  addressParts: Address | null;
  lat: number;
  lng: number;
  phone: string | null;
  email: string | null;
  active: boolean;
  chairs: Chair[];
  hours: OpeningHours;
  channels: ChannelData[];
  photos: PhotoData[];
  createdAt: Date;
}

export interface CreateLocationInput {
  id: string;
  code: string;
  name: string;
  address: string;
  addressParts?: AddressProps | undefined;
  coordinates: Coordinates;
  phone?: string | null;
  email?: string | null;
  hours: OpeningHours;
  createdAt: Date;
}

/** Опційний патч профілю локації (undefined = не змінювати). */
export interface LocationProfilePatch {
  name?: string | undefined;
  address?: string | undefined;
  addressParts?: Address | undefined;
  coordinates?: Coordinates | undefined;
  phone?: string | null | undefined;
  email?: string | null | undefined;
}
