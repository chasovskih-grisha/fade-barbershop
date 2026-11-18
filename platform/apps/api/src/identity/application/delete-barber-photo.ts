import type { BarberPhotoRepository } from '../domain/ports.barber-photo';
import type { UserRepository } from '../domain/ports';
import { BarberNotFoundError } from './barber-errors';
import type { PublicMediaStorage } from '../../shared/media/public-media-storage';

export interface DeleteBarberPhotoDeps {
  users: UserRepository;
  photos: BarberPhotoRepository;
  media: PublicMediaStorage;
}

export class DeleteBarberPhotoHandler {
  constructor(private readonly deps: DeleteBarberPhotoDeps) {}

  async handle(userId: string): Promise<void> {
    const user = await this.deps.users.findById(userId);
    if (!user || user.role !== 'barber') {
      throw new BarberNotFoundError();
    }
    const previous = await this.deps.photos.findByUserId(userId);
    if (!previous) return;

    await this.deps.photos.delete(userId);
    await this.deps.media.remove([previous.objectKey]).catch(() => undefined);
  }
}
