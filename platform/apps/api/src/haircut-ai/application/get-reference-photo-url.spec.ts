// Юніт-тести підписаного URL референсного фото (T-043, REF-WEB-03; ADR 0008 §2).
// Найважливіше тут — ACL: фото з обличчям не віддається ні чужим, ні видаленим.
import { GetReferencePhotoUrl, ReferencePhotoNotFoundError } from './get-reference-photo-url';
import { SIGNED_URL_TTL_SEC } from './ai-read-model';
import { InMemoryPhotos, InMemoryStorage } from './fakes';
import { makePhoto } from './test-fixtures';

function build(photoOwnerId = 'user-1') {
  const photos = new InMemoryPhotos();
  const storage = new InMemoryStorage();
  photos.seed(makePhoto({ ownerId: photoOwnerId }));
  return { photos, storage, useCase: new GetReferencePhotoUrl({ photos, storage }) };
}

const call = (useCase: GetReferencePhotoUrl, actorId: string, photoId = 'photo-1') =>
  useCase.execute({ photoId, actorId });

describe('підписаний URL референсного фото (ADR 0008 §2)', () => {
  it('власник отримує URL із коротким TTL', async () => {
    const { useCase } = build('user-1');
    const result = await call(useCase, 'user-1');
    expect(result.url).toContain('user-1/photo.jpg');
    expect(result.expiresInSeconds).toBe(SIGNED_URL_TTL_SEC);
    expect(result.contentType).toBe('image/jpeg');
  });

  it('URL підписаний на обʼєкт, а не на публічний бакет', async () => {
    const { useCase } = build('user-1');
    const result = await call(useCase, 'user-1');
    expect(result.url).toContain(`ttl=${SIGNED_URL_TTL_SEC}`);
    expect(result.url.startsWith('https://signed.test/')).toBe(true);
  });

  it('чужий клієнт отримує 404-подібну помилку, а не фото (немає витоку існування)', async () => {
    const { useCase } = build('user-1');
    await expect(call(useCase, 'user-2')).rejects.toBeInstanceOf(ReferencePhotoNotFoundError);
  });

  it('невідомий photoId — те сама помилка, що й для чужого (не відрізняємо випадки)', async () => {
    const { useCase } = build('user-1');
    await expect(call(useCase, 'user-1', 'photo-none')).rejects.toBeInstanceOf(
      ReferencePhotoNotFoundError
    );
  });

  it('мʼяко видалене фото недоступне навіть власнику (AI-WEB-07)', async () => {
    const { photos, useCase } = build('user-1');
    photos.seed(makePhoto({ ownerId: 'user-1', deletedAt: new Date('2026-03-02') }));
    await expect(call(useCase, 'user-1')).rejects.toBeInstanceOf(ReferencePhotoNotFoundError);
  });

  it('фото гостя (ownerId anonymous) не віддається авторизованому клієнту', async () => {
    // Усі гості мають однаков ownerId — власника розрізнити неможливо,
    // тому видача за id була б витіком фото з обличчям.
    const { useCase } = build('anonymous');
    await expect(call(useCase, 'user-1')).rejects.toBeInstanceOf(ReferencePhotoNotFoundError);
  });

  // Пункт реалізації: batch-fetch для календарної сітки — окремо, через порт SourcePhotoRepository.findByIds.
});
