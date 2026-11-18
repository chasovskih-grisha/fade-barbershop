// DTO і мапер відповіді барбера (MNG-ADM-05) — окремо від контролера.
import type { User } from '../domain/user';
import type { BarberPhoto } from '../domain/barber-photo';
import type { PublicMediaStorage } from '../../shared/media/public-media-storage';

export interface BarberPhotoDto {
  url: string;
  alt: string;
  consentAt: string | null;
  consentBy: string | null;
  updatedAt: string;
}

export interface BarberDto {
  id: string;
  phone: string;
  name: string | null;
  active: boolean;
  selfSchedule: boolean;
  photo: BarberPhotoDto | null;
}

export interface CreateBarberDto {
  name: string;
  phone: string;
}

export interface UpdateBarberDto {
  name?: string;
  selfSchedule?: boolean;
}

export function toBarberPhotoDto(
  photo: BarberPhoto | null,
  media: PublicMediaStorage
): BarberPhotoDto | null {
  if (!photo) return null;
  return {
    url: media.publicUrl(photo.objectKey),
    alt: photo.alt,
    consentAt: photo.consentAt ? photo.consentAt.toISOString() : null,
    consentBy: photo.consentBy,
    updatedAt: photo.updatedAt.toISOString(),
  };
}

export function toBarberDto(
  barber: User,
  photo: BarberPhoto | null = null,
  media?: PublicMediaStorage
): BarberDto {
  return {
    id: barber.id,
    phone: barber.phone.value,
    name: barber.name,
    active: barber.active,
    selfSchedule: barber.selfSchedule,
    photo: media && photo ? toBarberPhotoDto(photo, media) : null,
  };
}
