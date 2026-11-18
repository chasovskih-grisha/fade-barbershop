// Створення HaircutSuggestion (AI-WEB-04): фабрика — pending-старт,
// валідація variantCount (лише 3 або 4 за контрактом AI-WEB-01).
// Статус-машина — haircut-suggestion.spec.ts.
import { HaircutSuggestion } from './haircut-suggestion';
import type { Clock, IdGenerator } from './ports';

const NOW = new Date('2026-03-01T10:00:00.000Z');
const clock: Clock = { now: () => NOW };
let counter = 0;
const ids: IdGenerator = { id: () => `id-${++counter}` };

describe('HaircutSuggestion.create (AI-WEB-04)', () => {
  it('нове припущення стартує в pending без варіантів', () => {
    const suggestion = HaircutSuggestion.create({
      sourcePhotoId: 'p',
      ownerId: 'u',
      variantCount: 3,
      clock,
      ids,
    });

    expect(suggestion.status).toBe('pending');
    expect(suggestion.variants).toEqual([]);
  });

  it.each([2, 5])('variantCount=%i поза контрактом → помилка про variantCount', (variantCount) => {
    const create = () =>
      HaircutSuggestion.create({ sourcePhotoId: 'p', ownerId: 'u', variantCount, clock, ids });

    expect(create).toThrow(/variantCount/);
  });
});
