// Кабінет клієнта (T-052, REF-WEB-03): лише власні фото й генерації, лічильник
// добового ліміту, підписані URL. Гість (публічний booking-флоу) сюди не має
// доступу — контролер вимагає сесію.

import { ListMyAiHandler } from './list-my-ai';
import { InMemoryPhotos, InMemoryStorage, InMemorySuggestions } from './fakes';
import { makePhoto, makeSuggestion, testClock } from './test-fixtures';

function build() {
  const photos = new InMemoryPhotos();
  const suggestions = new InMemorySuggestions();
  const list = new ListMyAiHandler({
    photos,
    suggestions,
    storage: new InMemoryStorage(),
    clock: testClock,
  });
  return { photos, suggestions, list };
}

describe('ListMyAi (REF-WEB-03)', () => {
  it('показує власні фото й генерації з підписаними URL', async () => {
    const { photos, suggestions, list } = build();
    photos.seed(makePhoto());
    suggestions.seed(makeSuggestion('ready'));

    const result = await list.handle('user-1');

    expect(result.photos).toHaveLength(1);
    expect(result.photos[0]?.url).toContain('ttl=900');
    expect(result.generations).toHaveLength(1);
    expect(result.generations[0]?.variants?.length).toBe(2);
  });

  it('лічильник дня враховує витрачені генерації (3 − 1 = 2)', async () => {
    const { suggestions, list } = build();
    suggestions.seed(makeSuggestion('ready'));

    const result = await list.handle('user-1');

    expect(result.remainingToday).toBe(2);
  });

  it('failed-генерації не зменшують залишок (AI-WEB-06)', async () => {
    const { suggestions, list } = build();
    suggestions.seed(makeSuggestion('failed'));

    const result = await list.handle('user-1');

    expect(result.remainingToday).toBe(3);
  });

  it('фото без згоди повертається до кабінету — користувач бачить своє фото', async () => {
    const { photos, list } = build();
    photos.seed(makePhoto({ consentGranted: false, consentGrantedAt: null }));

    const result = await list.handle('user-1');

    expect(result.photos[0]?.consentGranted).toBe(false);
  });

  it('чужих фото в кабінеті немає', async () => {
    const { photos, list } = build();
    photos.seed(makePhoto({ id: 'photo-x', ownerId: 'someone-else' }));

    const result = await list.handle('user-1');

    expect(result.photos).toHaveLength(0);
    expect(result.generations).toHaveLength(0);
  });

  it('видалені фото не потрапляють у кабінет', async () => {
    const { photos, list } = build();
    photos.seed(makePhoto({ deletedAt: testClock.now() }));

    expect((await list.handle('user-1')).photos).toHaveLength(0);
  });
});
