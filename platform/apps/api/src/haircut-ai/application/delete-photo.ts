// DeletePhoto — клієнт видаляє своє фото разом із результатами генерації
// (AI-WEB-07, AI-ADM-06). Порядок: рядок фото + каскад генерацій зникають у
// транзакції, об'єкти з бакета чистимо після коміту. Падіння чистки об'єктів не
// ламає видалення для користувача: рядки вже gone, лишився orphans-бакет, який
// забере ретеншен-воркер.

import { PhotoAlreadyDeletedError, SourcePhotoNotFoundError } from './haircut-errors';
import type {
  Clock,
  HaircutSuggestionRepository,
  Outbox,
  PhotoStorage,
  SourcePhotoRepository,
  UnitOfWork,
} from '../domain/ports';

export interface DeletePhotoInput {
  sourcePhotoId: string;
  ownerId: string;
}

export interface DeletePhotoOutput {
  success: true;
  deletedObjects: number;
}

export interface DeletePhotoDeps {
  photos: SourcePhotoRepository;
  suggestions: HaircutSuggestionRepository;
  storage: PhotoStorage;
  outbox: Outbox;
  clock: Clock;
  uow: UnitOfWork;
}

export class DeletePhotoHandler {
  constructor(private readonly deps: DeletePhotoDeps) {}

  async handle(input: DeletePhotoInput): Promise<DeletePhotoOutput> {
    const { photos, suggestions, storage, outbox, clock, uow } = this.deps;

    const result = await uow.run(async () => {
      const photo = await photos.findById(input.sourcePhotoId);
      if (!photo || photo.ownerId !== input.ownerId) {
        throw new SourcePhotoNotFoundError(input.sourcePhotoId);
      }
      if (photo.isDeleted) throw new PhotoAlreadyDeletedError();

      const generations = await suggestions.findBySourcePhotoId(input.sourcePhotoId);
      const variantKeys = generations.flatMap((g) => g.variants.map((v) => v.objectKey));
      const event = photo.markDeleted(clock, 'user_request', variantKeys);
      if (event) await outbox.append([event]);
      await photos.remove(input.sourcePhotoId);

      return [photo.objectKey, ...variantKeys];
    });

    // Після коміту: об'єкти бакета не тримають транзакцію відкритою.
    await removeQuietly(storage, result);
    return { success: true, deletedObjects: result.length };
  }
}

async function removeQuietly(storage: PhotoStorage, objectKeys: readonly string[]): Promise<void> {
  try {
    await storage.remove(objectKeys);
  } catch {
    // Ретеншен-воркер (AI-ADM-06) прибере orphans з бакета за розкладом.
  }
}
