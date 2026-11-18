// Юніт-тести UploadPhoto (T-043, REF-WEB-05): валідація, агрегат SourcePhoto, подія.
// Сховище й репозиторій — in-memory фейки (ADR 0019: без AWS і БД).

import { UploadPhoto, ANONYMOUS_OWNER } from './upload-photo.use-case';
import { InvalidPhotoError } from './photo-errors';
import { InMemoryPhotos, InMemoryStorage, RecordingOutbox, noTransaction } from './fakes';
import { testClock } from './test-fixtures';

let seq = 0;

function build() {
  seq = 0;
  const photos = new InMemoryPhotos();
  const storage = new InMemoryStorage();
  const outbox = new RecordingOutbox();
  const useCase = new UploadPhoto({
    storage,
    photos,
    outbox,
    clock: testClock,
    ids: { id: () => `photo-${++seq}` },
    uow: noTransaction,
  });
  return { photos, storage, outbox, useCase };
}

/** Валідне мінімальне фото (ADR 0015 §1). */
const png = (bytes: readonly number[] = [1]) => ({
  bytes: new Uint8Array(bytes),
  contentType: 'image/png',
  ownerId: 'u',
});

describe('UploadPhoto (T-043)', () => {
  it('зберігає валідне jpeg-фото і повертає photoId', async () => {
    const { storage, useCase } = build();

    // prettier-ignore
    const result = await useCase.execute({ bytes: new Uint8Array([0xff, 0xd8, 0xff]), contentType: 'image/jpeg', ownerId: 'user-1' });

    expect(result.photoId).toBe('photo-1');
    expect(result.objectKey).toBe(storage.objects.keys().next().value);
  });

  it('створює SourcePhoto і пише PhotoUploaded у outbox', async () => {
    const { photos, outbox, useCase } = build();

    await useCase.execute(png());

    expect(photos.rows.get('photo-1')?.id).toBe('photo-1');
    expect(outbox.types()).toEqual(['haircut-ai.photo.uploaded']);
  });

  it('згода на AI НЕ ставиться автоматично (AI-WEB-02)', async () => {
    const { photos, useCase } = build();

    await useCase.execute(png());

    const photo = photos.rows.get('photo-1');
    expect(photo?.consentGranted).toBe(false);
    expect(photo?.canGenerate).toBe(false);
  });

  it('приймає png і webp (ADR 0015 §1)', async () => {
    const { storage, useCase } = build();

    await useCase.execute(png());
    await useCase.execute({ ...png(), contentType: 'image/webp' });

    expect(storage.objects.size).toBe(2);
  });
});

describe('UploadPhoto — валідація (REF-WEB-05, ADR 0015 §1)', () => {
  it.each(['image/gif', 'application/pdf', 'text/plain'])('відхиляє %s', async (contentType) => {
    const { storage, useCase } = build();

    await expect(useCase.execute({ ...png(), contentType })).rejects.toThrow(InvalidPhotoError);
    expect(storage.objects.size).toBe(0);
  });

  it('відхиляє порожній або надто великий файл', async () => {
    const { useCase } = build();
    const jpeg = (bytes: Uint8Array) => ({ ...png(), bytes, contentType: 'image/jpeg' });
    const tooBig = new Uint8Array(10 * 1024 * 1024 + 1);
    await expect(useCase.execute(jpeg(new Uint8Array(0)))).rejects.toThrow(InvalidPhotoError);
    await expect(useCase.execute(jpeg(tooBig))).rejects.toThrow(InvalidPhotoError);
  });
});

describe('UploadPhoto — власник', () => {
  it('без ownerId (dev без сесії) — ключ під anonymous', async () => {
    const { photos, useCase } = build();

    const result = await useCase.execute({ ...png(), ownerId: '' });
    expect(result.objectKey.startsWith(`${ANONYMOUS_OWNER}/`)).toBe(true);
    expect(photos.rows.get('photo-1')?.ownerId).toBe(ANONYMOUS_OWNER);
  });
});
