// Спільні фейки для спек фото барбера (T-4610a): репозиторій у пам'яті і
// фабрика User-барбера. Окремо — LOC-гейт і повторне використання у двох спеках.
import { FakeUserRepository, FakeClock } from './ports.fakes';
import { User } from '../domain/user';
import { PhoneNumber } from '../domain/phone-number';
import { MemPublicMediaStorage } from '../../shared/media/public-media-storage.fakes';
import { SetBarberPhotoHandler, type SetBarberPhotoDeps } from './set-barber-photo';
import { DeleteBarberPhotoHandler } from './delete-barber-photo';
import type { BarberPhoto } from '../domain/barber-photo';
import type { BarberPhotoRepository } from '../domain/ports.barber-photo';

export const T0 = new Date('2026-11-12T10:00:00.000Z');
export const PNG = { bytes: new Uint8Array([1, 2, 3]), contentType: 'image/png' };

export class FakeBarberPhotoRepository implements BarberPhotoRepository {
  private store = new Map<string, BarberPhoto>();
  async findByUserId(userId: string): Promise<BarberPhoto | null> {
    return this.store.get(userId) ?? null;
  }
  async save(photo: BarberPhoto): Promise<void> {
    this.store.set(photo.userId, photo);
  }
  async delete(userId: string): Promise<void> {
    this.store.delete(userId);
  }
}

export function barberUser(id: string, role: 'barber' | 'client'): User {
  return User.create({
    id,
    phone: PhoneNumber.of('+380501234567'),
    role,
    name: 'Іван',
    createdAt: T0,
  });
}

export function setup() {
  const users = new FakeUserRepository();
  const photos = new FakeBarberPhotoRepository();
  const media = new MemPublicMediaStorage();
  const deps: SetBarberPhotoDeps = {
    users,
    photos,
    media,
    clock: new FakeClock(T0.toISOString()),
  };
  return {
    users,
    photos,
    media,
    setPhoto: new SetBarberPhotoHandler(deps),
    deletePhoto: new DeleteBarberPhotoHandler({ users, photos, media }),
  };
}
