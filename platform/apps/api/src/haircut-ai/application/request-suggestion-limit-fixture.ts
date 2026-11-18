// Спільний fixture для ліміту / variantCount specs RequestSuggestion.

import { RequestSuggestionHandler } from './request-suggestion';
import { InMemoryPhotos, InMemorySuggestions, noTransaction, sequentialIds } from './fakes';
import { makePhoto, testClock } from './test-fixtures';

export function buildLimitFixture() {
  const photos = new InMemoryPhotos();
  const suggestions = new InMemorySuggestions();
  photos.seed(makePhoto());
  const handler = new RequestSuggestionHandler({
    photos,
    suggestions,
    clock: testClock,
    ids: sequentialIds('new'),
    uow: noTransaction,
  });
  return { suggestions, handler };
}
