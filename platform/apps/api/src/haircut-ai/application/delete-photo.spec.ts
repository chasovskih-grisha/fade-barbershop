// Функціональні тести DeletePhoto (T-052, AI-WEB-07/AI-ADM-06): фото, генерації
// й об'єкти бакета видаляються разом; збій чистки бакета не ламає клієнта.

import { DeletePhotoHandler } from './delete-photo';
import { PhotoAlreadyDeletedError, SourcePhotoNotFoundError } from './haircut-errors';
import { InMemoryPhotos, InMemoryStorage, InMemorySuggestions, RecordingOutbox, noTransaction } from './fakes';
import { makePhoto, makeSuggestion, makeVariants, testClock } from './test-fixtures';

function build() {
  const photos = new InMemoryPhotos();
  const suggestions = new InMemorySuggestions();
  const storage = new InMemoryStorage();
  const outbox = new RecordingOutbox();
  const deps = { photos, suggestions, storage, outbox, clock: testClock, uow: noTransaction };
  return { photos, suggestions, storage, outbox, remove: new DeletePhotoHandler(deps) };
}

function putObject(storage: InMemoryStorage, objectKey: string, contentType: string): void {
  storage.objects.set(objectKey, {
    objectKey,
    bucket: 'haircut-ai-photos',
    contentType,
    sizeBytes: 1,
  });
}

describe('DeletePhoto (AI-WEB-07)', () => {
  it('видаляє фото, рядки генерацій і об’єкти оригіналу + варіантів', async () => {
    const { photos, suggestions, storage, outbox, remove } = build();
    photos.seed(makePhoto());
    suggestions.seed(makeSuggestion('ready'));
    for (const [key, type] of [
      ['user-1/photo.jpg', 'image/jpeg'],
      ...makeVariants().map((v) => [v.objectKey, v.contentType]),
    ]) {
      putObject(storage, key as string, type as string);
    }

    const result = await remove.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' });

    expect(result).toEqual({ success: true, deletedObjects: 3 });
    expect(photos.rows.has('photo-1')).toBe(false);
    expect(storage.objects.size).toBe(0);
    expect(outbox.events[0]?.payload).toMatchObject({ reason: 'user_request' });
  });

  it('падіння чистки бакета не ламає видалення для клієнта', async () => {
    const { photos, storage, remove } = build();
    photos.seed(makePhoto());
    storage.remove = async () => {
      throw new Error('S3 unreachable');
    };

    await expect(
      remove.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' })
    ).resolves.toMatchObject({ success: true });
    expect(photos.rows.has('photo-1')).toBe(false);
  });

  it('генерація без варіантів не додає ключів до чистки', async () => {
    const { photos, suggestions, remove } = build();
    photos.seed(makePhoto());
    suggestions.seed(makeSuggestion('failed'));

    await expect(remove.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' })).resolves.toEqual({
      success: true,
      deletedObjects: 1,
    });
  });
});

describe('DeletePhoto — власність (сесія, не тіло запиту)', () => {
  it('чуже фото — NotFound, нічого не видалено', async () => {
    const { photos, remove } = build();
    photos.seed(makePhoto());

    await expect(remove.handle({ sourcePhotoId: 'photo-1', ownerId: 'attacker' })).rejects.toThrow(
      SourcePhotoNotFoundError
    );
    expect(photos.rows.size).toBe(1);
  });

  it('повторне видалення — PhotoAlreadyDeletedError', async () => {
    const { photos, remove } = build();
    photos.seed(makePhoto({ deletedAt: testClock.now() }));

    await expect(remove.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' })).rejects.toThrow(
      PhotoAlreadyDeletedError
    );
  });
});
