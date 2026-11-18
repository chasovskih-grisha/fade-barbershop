// Read-модель статусу генерації (T-052, AI-WEB-03): підписані URL замість
// сирих ключів, машиночитна причина падіння, приватність чужих генерацій.

import { GetSuggestionStatusHandler } from './get-suggestion-status';
import { SuggestionNotFoundError } from './haircut-errors';
import { InMemoryStorage, InMemorySuggestions } from './fakes';
import { makeSuggestion, testClock } from './test-fixtures';

function build() {
  const suggestions = new InMemorySuggestions();
  const status = new GetSuggestionStatusHandler({ suggestions, storage: new InMemoryStorage() });
  return { suggestions, status };
}

describe('GetSuggestionStatus (AI-WEB-03)', () => {
  it('ready — підписані URL з TTL', async () => {
    const { suggestions, status } = build();
    suggestions.seed(makeSuggestion('ready'));

    const result = await status.handle({ suggestionId: 'sug-1', ownerId: 'user-1' });

    expect(result.status).toBe('ready');
    expect(result.variants).toHaveLength(2);
    expect(result.variants.every((v) => v.url.includes('ttl=900'))).toBe(true);
  });

  it('processing — без варіантів (клієнт полліть далі)', async () => {
    const { suggestions, status } = build();
    suggestions.seed(makeSuggestion('processing'));

    const result = await status.handle({ suggestionId: 'sug-1', ownerId: 'user-1' });

    expect(result.variants).toEqual([]);
    expect(result.status).toBe('processing');
  });

  it('pending — без варіантів', async () => {
    const { suggestions, status } = build();
    suggestions.seed(makeSuggestion('pending'));

    const result = await status.handle({ suggestionId: 'sug-1', ownerId: 'user-1' });

    expect(result.status).toBe('pending');
    expect(result.variants).toEqual([]);
  });

  it('failed — машиночитна причина + текст для клієнта', async () => {
    const { suggestions, status } = build();
    suggestions.seed(
      makeSuggestion('failed', {
        failureReason: 'provider_quota',
        errorMessage: 'черга переповнена',
      })
    );

    const result = await status.handle({ suggestionId: 'sug-1', ownerId: 'user-1' });

    expect(result.failureReason).toBe('provider_quota');
    expect(result.errorMessage).toBe('черга переповнена');
  });

  it('createdAt — ISO для клієнтського таймера', async () => {
    const { suggestions, status } = build();
    suggestions.seed(makeSuggestion('ready'));

    const result = await status.handle({ suggestionId: 'sug-1', ownerId: 'user-1' });

    expect(result.createdAt).toBe(testClock.now().toISOString());
  });

  it('чужа генерація — NotFound, не підтверджуємо існування (ADR 0015 §2)', async () => {
    const { suggestions, status } = build();
    suggestions.seed(makeSuggestion('ready'));

    await expect(status.handle({ suggestionId: 'sug-1', ownerId: 'attacker' })).rejects.toThrow(
      SuggestionNotFoundError
    );
  });

  it('невідома генерація — теж NotFound', async () => {
    const { status } = build();
    await expect(status.handle({ suggestionId: 'nope', ownerId: 'user-1' })).rejects.toThrow(
      SuggestionNotFoundError
    );
  });
});
