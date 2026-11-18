// Функціональні тести RequestSuggestion (T-051, AI-WEB-01/02): згода, власність
// і живий стан фото. Провайдер з HTTP-запиту не кликається — це робота воркера
// (ai-generation.cycle.spec.ts).

import { RequestSuggestionHandler } from './request-suggestion';
import { ConsentRequiredError, PhotoAlreadyDeletedError, SourcePhotoNotFoundError } from './haircut-errors';
import { InMemoryPhotos, InMemorySuggestions, noTransaction, sequentialIds, testClock } from './fakes';
import { makePhoto } from './test-fixtures';

function build() {
  const photos = new InMemoryPhotos();
  const suggestions = new InMemorySuggestions();
  const handler = new RequestSuggestionHandler({
    photos,
    suggestions,
    clock: testClock,
    ids: sequentialIds('sug'),
    uow: noTransaction,
  });
  return { photos, suggestions, handler };
}

describe('RequestSuggestion (AI-WEB-01/02)', () => {
  it('створює pending-генерацію для фото зі згодою', async () => {
    const { photos, suggestions, handler } = build();
    photos.seed(makePhoto());

    const result = await handler.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' });

    expect(result.status).toBe('pending');
    expect(suggestions.rows.get(result.suggestionId)?.status).toBe('pending');
  });

  it('провайдер НЕ викликається з HTTP-запиту (лише pending-рядок)', async () => {
    const { photos, suggestions, handler } = build();
    photos.seed(makePhoto());

    await handler.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' });

    expect([...suggestions.rows.values()].every((s) => s.status === 'pending')).toBe(true);
  });

  it('без згоди — ConsentRequiredError (AI-WEB-02)', async () => {
    const { photos, handler } = build();
    photos.seed(makePhoto({ consentGranted: false, consentGrantedAt: null }));

    await expect(handler.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' })).rejects.toThrow(
      ConsentRequiredError
    );
  });

  it('згода відкликана — теж відмова', async () => {
    const { photos, handler } = build();
    const photo = makePhoto();
    photo.revokeConsent(testClock);
    photos.seed(photo);

    await expect(handler.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' })).rejects.toThrow(
      ConsentRequiredError
    );
  });

  it('чужое фото — NotFound, а не Forbidden (не підтверджуємо існування)', async () => {
    const { photos, handler } = build();
    photos.seed(makePhoto());

    await expect(
      handler.handle({ sourcePhotoId: 'photo-1', ownerId: 'someone-else' })
    ).rejects.toThrow(SourcePhotoNotFoundError);
  });

  it('видалене фото — PhotoAlreadyDeletedError', async () => {
    const { photos, handler } = build();
    photos.seed(makePhoto({ deletedAt: testClock.now() }));

    await expect(handler.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' })).rejects.toThrow(
      PhotoAlreadyDeletedError
    );
  });
});
