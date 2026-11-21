// Вибір варіанта клієнтом (T-052, REF-WEB-02): лише з готової генерації, лише
// її варіант, з публікацією VariantSelected (consuming: scheduling створює
// HaircutReference на запис).

import { SelectVariantHandler } from './select-variant';
import {
  InvalidGenerationStatusError,
  SuggestionNotFoundError,
  VariantNotFoundError,
} from './haircut-errors';
import { InMemoryStorage, InMemorySuggestions, RecordingOutbox, noTransaction } from './fakes';
import { VARIANT_KEYS, makeSuggestion, testClock } from './test-fixtures';

function build() {
  const suggestions = new InMemorySuggestions();
  const storage = new InMemoryStorage();
  const outbox = new RecordingOutbox();
  return {
    suggestions,
    outbox,
    select: new SelectVariantHandler({
      suggestions,
      storage,
      outbox,
      clock: testClock,
      uow: noTransaction,
    }),
  };
}

const pick = (objectKey: string) => ({
  suggestionId: 'sug-1',
  ownerId: 'user-1',
  variantObjectKey: objectKey,
});

describe('SelectVariant (REF-WEB-02)', () => {
  it('готова генерація — VariantSelected у outbox і підписаний URL обраного', async () => {
    const { suggestions, outbox, select } = build();
    suggestions.seed(makeSuggestion('ready'));

    const result = await select.handle(pick(VARIANT_KEYS[0]));

    expect(result.success).toBe(true);
    expect(result.variant.url).toContain('ttl=900');
    expect(outbox.events).toHaveLength(1);
    expect(outbox.events[0]?.type).toBe('haircut-ai.variant.selected');
  });

  it('поджить точний objectKey обраного варіанта (не довільний)', async () => {
    const { suggestions, outbox, select } = build();
    suggestions.seed(makeSuggestion('ready'));

    await select.handle(pick(VARIANT_KEYS[1]));

    expect(outbox.events[0]?.payload).toMatchObject({
      selectedVariant: { objectKey: VARIANT_KEYS[1] },
    });
  });

  it('варіант не з цієї генерації — VariantNotFound', async () => {
    const { suggestions, select } = build();
    suggestions.seed(makeSuggestion('ready'));

    await expect(select.handle(pick('user-1/variants/evil.svg'))).rejects.toThrow(
      VariantNotFoundError
    );
  });

  it('не готова генерація — InvalidGenerationStatusError', async () => {
    const { suggestions, select } = build();
    suggestions.seed(makeSuggestion('processing'));

    await expect(select.handle(pick(VARIANT_KEYS[0]))).rejects.toThrow(
      InvalidGenerationStatusError
    );
  });

  it('failed-генерація — вибір неможливий', async () => {
    const { suggestions, select } = build();
    suggestions.seed(makeSuggestion('failed'));

    await expect(select.handle(pick(VARIANT_KEYS[0]))).rejects.toThrow(
      InvalidGenerationStatusError
    );
  });

  it('чужа генерація — NotFound (власність із сесії)', async () => {
    const { suggestions, select } = build();
    suggestions.seed(makeSuggestion('ready'));

    await expect(select.handle({ ...pick(VARIANT_KEYS[0]), ownerId: 'attacker' })).rejects.toThrow(
      SuggestionNotFoundError
    );
  });
});
