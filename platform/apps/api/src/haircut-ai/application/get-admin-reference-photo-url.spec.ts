// Юніт-тести підписаного URL для адмін/барбер-поверхні (REF-BARBER, T-043).
// Ключове: адмін бачить референс гостя (ownerId 'anonymous'), а мʼяко видалене
// фото не віддається навіть адміну.
import { GetAdminReferencePhotoUrl } from './get-admin-reference-photo-url';
import { ReferencePhotoNotFoundError } from './get-reference-photo-url';
import { SIGNED_URL_TTL_SEC } from './ai-read-model';
import { InMemoryPhotos, InMemoryStorage } from './fakes';
import { makePhoto } from './test-fixtures';

function build(ownerId = 'anonymous') {
  const photos = new InMemoryPhotos();
  const storage = new InMemoryStorage();
  photos.seed(makePhoto({ ownerId, objectKey: `${ownerId}/reference.jpg` }));
  return { photos, storage, useCase: new GetAdminReferencePhotoUrl({ photos, storage }) };
}

describe('адмінський підписаний URL референсу (REF-BARBER)', () => {
  it('віддає URL для фото гостя — власника для зіставлення не існує', async () => {
    const { useCase } = build('anonymous');
    const result = await useCase.execute({ photoId: 'photo-1' });
    expect(result.url).toContain('anonymous/reference.jpg');
    expect(result.expiresInSeconds).toBe(SIGNED_URL_TTL_SEC);
    expect(result.contentType).toBe('image/jpeg');
  });

  it('віддає URL і для фото логіненого клієнта (роль, а не володіння)', async () => {
    const { useCase } = build('user-1');
    const result = await useCase.execute({ photoId: 'photo-1' });
    expect(result.url).toContain('user-1/reference.jpg');
  });

  it('невідомий photoId — та сама помилка, без розкриття причини', async () => {
    const { useCase } = build();
    await expect(useCase.execute({ photoId: 'photo-none' })).rejects.toBeInstanceOf(
      ReferencePhotoNotFoundError
    );
  });

  it('мʼяко видалене фото недоступне навіть адміну (AI-WEB-07)', async () => {
    const { photos, useCase } = build();
    photos.seed(makePhoto({ ownerId: 'user-1', deletedAt: new Date('2026-03-02') }));
    await expect(useCase.execute({ photoId: 'photo-1' })).rejects.toBeInstanceOf(
      ReferencePhotoNotFoundError
    );
  });
});
