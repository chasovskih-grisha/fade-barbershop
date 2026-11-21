// Межі variantCount (AI-WEB-04) — окремо від добового ліміту.

import { buildLimitFixture } from './request-suggestion-limit-fixture';

describe('variantCount (AI-WEB-04)', () => {
  it.each([2, 5])('variantCount=%i поза 3..4 — помилка', async (variantCount) => {
    const { handler } = buildLimitFixture();
    await expect(
      handler.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1', variantCount })
    ).rejects.toThrow(/variantCount/);
  });

  it('за замовчуванням — 4 варіанти', async () => {
    const { suggestions, handler } = buildLimitFixture();
    const { suggestionId } = await handler.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' });
    expect(suggestions.rows.get(suggestionId)?.propsData?.variantCount).toBe(4);
  });

  it('явні 3 варіанти проходять', async () => {
    const { suggestions, handler } = buildLimitFixture();
    const { suggestionId } = await handler.handle({
      sourcePhotoId: 'photo-1',
      ownerId: 'user-1',
      variantCount: 3,
    });
    expect(suggestions.rows.get(suggestionId)?.propsData?.variantCount).toBe(3);
  });
});
