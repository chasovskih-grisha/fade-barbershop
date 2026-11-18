// Валідація мінімальної роздільності (AI-WEB-01): замале фото відхиляється
// до звернення до сховища, нерозпізнаний формат не блокує завантаження.
import { UploadPhoto } from './upload-photo.use-case';
import { InvalidPhotoError } from './photo-errors';
import { InMemoryPhotos, InMemoryStorage, RecordingOutbox, noTransaction } from './fakes';
import { testClock } from './test-fixtures';

function build() {
  let seq = 0;
  const storage = new InMemoryStorage();
  return {
    storage,
    useCase: new UploadPhoto({
      storage,
      photos: new InMemoryPhotos(),
      outbox: new RecordingOutbox(),
      clock: testClock,
      ids: { id: () => `photo-${++seq}` },
      uow: noTransaction,
    }),
  };
}

/** PNG із заданими розмірами (сигнатура + IHDR-заголовок). */
function png(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

describe('UploadPhoto — мінімальна роздільність (AI-WEB-01)', () => {
  it('відхиляє фото, менше за 800×800', async () => {
    const { storage, useCase } = build();

    await expect(
      useCase.execute({ bytes: png(400, 400), contentType: 'image/png', ownerId: 'u' })
    ).rejects.toThrow(InvalidPhotoError);
    expect(storage.objects.size).toBe(0);
  });

  it('приймає фото щонайменше 800×800', async () => {
    const { useCase } = build();

    const result = await useCase.execute({
      bytes: png(800, 800),
      contentType: 'image/png',
      ownerId: 'u',
    });

    expect(result.photoId).toBe('photo-1');
  });
});
