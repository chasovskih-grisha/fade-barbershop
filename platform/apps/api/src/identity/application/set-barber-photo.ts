import { uuidv7 } from '@fade/domain-shared';
import {
  buildBarberPhoto,
  InvalidBarberPhotoError,
  type BarberPhoto,
} from '../domain/barber-photo';
import type { BarberPhotoRepository } from '../domain/ports.barber-photo';
import type { Clock, UserRepository } from '../domain/ports';
import { BarberNotFoundError, InvalidBarberInputError } from './barber-errors';
import {
  MediaProcessingError,
  PUBLIC_MEDIA_INPUT_TYPES,
  type PublicMediaStorage,
} from '../../shared/media/public-media-storage';

export interface BarberPhotoFile {
  bytes: Uint8Array;
  contentType: string;
}

export interface SetBarberPhotoInput {
  userId: string;
  alt: string;
  consent: boolean;
  adminIdentifier: string;
  file: BarberPhotoFile;
}

export interface SetBarberPhotoDeps {
  users: UserRepository;
  photos: BarberPhotoRepository;
  media: PublicMediaStorage;
  clock: Clock;
}

export class SetBarberPhotoHandler {
  constructor(private readonly deps: SetBarberPhotoDeps) {}

  async handle(input: SetBarberPhotoInput): Promise<BarberPhoto> {
    const user = await this.deps.users.findById(input.userId);
    if (!user || user.role !== 'barber') {
      throw new BarberNotFoundError();
    }
    if (!input.consent) {
      throw new InvalidBarberInputError(
        'Необхідно підтвердити згоду барбера на публікацію фото (ADR 0015)'
      );
    }

    if (!(PUBLIC_MEDIA_INPUT_TYPES as readonly string[]).includes(input.file.contentType)) {
      throw new InvalidBarberInputError(`Unsupported image type: ${input.file.contentType}`);
    }

    const previous = await this.deps.photos.findByUserId(input.userId);
    // Ключ об'єкта в сховищі — теж UUID (ADR 0021): один генератор на систему.
    const objectKey = `barbers/${input.userId}/${uuidv7()}`;

    let uploaded;
    try {
      uploaded = await this.deps.media.put({
        bytes: input.file.bytes,
        contentType: input.file.contentType,
        key: objectKey,
      });
    } catch (error) {
      if (error instanceof MediaProcessingError) {
        throw new InvalidBarberInputError('Не вдалося обробити зображення');
      }
      throw error;
    }

    let photo: BarberPhoto;
    try {
      photo = buildBarberPhoto({
        userId: input.userId,
        objectKey: uploaded.objectKey,
        alt: input.alt,
        width: null,
        height: null,
        consentAt: this.deps.clock.now(),
        consentBy: input.adminIdentifier,
        updatedAt: this.deps.clock.now(),
      });
    } catch (error) {
      await this.deps.media.remove([uploaded.objectKey]).catch(() => undefined);
      if (error instanceof InvalidBarberPhotoError) {
        throw new InvalidBarberInputError(error.message);
      }
      throw error;
    }

    await this.deps.photos.save(photo);
    if (previous) {
      await this.deps.media.remove([previous.objectKey]).catch(() => undefined);
    }
    return photo;
  }
}
