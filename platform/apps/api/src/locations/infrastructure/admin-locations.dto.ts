import type { Location } from '../domain/location';
import type { LocationLogo } from '../domain/location-logo';
import type { PublicMediaStorage } from '../../shared/media/public-media-storage';

/** Структурована адреса (T-4405); display-рядок рахує домен через `formatted()`. */
export interface AddressPartsDto {
  street: string;
  building: string;
  city: string;
  postalCode?: string;
  country?: string;
}

/** Запит на створення локації (JSON-форма значень домену). */
export interface CreateLocationDto {
  code: string;
  name: string;
  address: string;
  addressParts?: AddressPartsDto;
  lat: number;
  lng: number;
  phone?: string | null;
  email?: string | null;
  hours: { dayOfWeek: number; open: string | null; close: string | null; closed: boolean }[];
}

export interface UpdateLocationDto {
  name?: string;
  address?: string;
  addressParts?: AddressPartsDto;
  lat?: number;
  lng?: number;
  phone?: string | null;
  email?: string | null;
  active?: boolean;
  hours?: { dayOfWeek: number; open: string | null; close: string | null; closed: boolean }[];
  chairs?: { number: number; name: string | null; active: boolean }[];
  channels?: { channel: string; value: string; sortOrder?: number }[];
  photos?: { url: string; caption?: string | null; sortOrder?: number }[];
}

/** Публічні URL логотипа (T-4609b): null darkUrl = темна тема бере light. */
export interface LocationLogoDto {
  variant: 'mark' | 'lockup';
  lightUrl: string;
  darkUrl: string | null;
  alt: string;
}

export function toLocationLogoDto(logo: LocationLogo, media: PublicMediaStorage): LocationLogoDto {
  return {
    variant: logo.variant,
    lightUrl: media.publicUrl(logo.lightKey),
    darkUrl: logo.darkKey ? media.publicUrl(logo.darkKey) : null,
    alt: logo.alt,
  };
}

export interface LocationDto {
  id: string;
  code: string;
  name: string;
  address: string;
  addressParts: AddressPartsDto | null;
  lat: number;
  lng: number;
  phone: string | null;
  email: string | null;
  active: boolean;
  chairs: { number: number; name: string | null; active: boolean }[];
  channels: { channel: string; value: string; sortOrder: number }[];
  photos: { url: string; caption: string | null; sortOrder: number }[];
  hours: { dayOfWeek: number; open: string | null; close: string | null; closed: boolean }[];
  /** Логотип локації; null — локація без знака (споживач бере мережевий фолбек). */
  logo: LocationLogoDto | null;
}

export function toLocationDto(
  location: Location,
  logo: LocationLogoDto | null = null
): LocationDto {
  return {
    logo,
    id: location.id,
    code: location.code,
    name: location.name,
    address: location.address,
    addressParts: location.addressParts
      ? {
          street: location.addressParts.street,
          building: location.addressParts.building,
          city: location.addressParts.city,
          ...(location.addressParts.postalCode
            ? { postalCode: location.addressParts.postalCode }
            : {}),
          country: location.addressParts.country,
        }
      : null,
    lat: location.lat,
    lng: location.lng,
    phone: location.phone,
    email: location.email,
    active: location.active,
    chairs: location.chairs.map((c) => ({ number: c.number, name: c.name, active: c.active })),
    channels: location.channels.map((c) => ({
      channel: c.channel,
      value: c.value,
      sortOrder: c.sortOrder,
    })),
    photos: location.photos.map((p) => ({
      url: p.url,
      caption: p.caption,
      sortOrder: p.sortOrder,
    })),
    hours: location.hours.days.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      open: h.open,
      close: h.close,
      closed: h.closed,
    })),
  };
}
