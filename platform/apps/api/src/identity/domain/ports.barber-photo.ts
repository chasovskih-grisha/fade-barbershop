import type { BarberPhoto } from './barber-photo';

export interface BarberPhotoRepository {
  findByUserId(userId: string): Promise<BarberPhoto | null>;
  save(photo: BarberPhoto): Promise<void>;
  delete(userId: string): Promise<void>;
}

export const BARBER_PHOTO_REPOSITORY = Symbol('BARBER_PHOTO_REPOSITORY');
