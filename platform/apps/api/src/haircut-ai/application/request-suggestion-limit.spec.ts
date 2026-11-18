// Добовий ліміт генерацій (AI-WEB-05/06, AI-ADM-03) — окремо від happy path,
// бо правило має бути видно повністю.

import { DAILY_GENERATION_LIMIT } from './request-suggestion';
import { GenerationLimitExceededError } from './haircut-errors';
import { makeSuggestion, testClock } from './test-fixtures';
import { buildLimitFixture } from './request-suggestion-limit-fixture';

const HOUR = 60 * 60 * 1000;

describe('Добовий ліміт (AI-WEB-05/06)', () => {
  it(`4-та генерація за добу відхиляється (ліміт ${DAILY_GENERATION_LIMIT})`, async () => {
    const { suggestions, handler } = buildLimitFixture();
    const now = testClock.now();
    for (let i = 0; i < DAILY_GENERATION_LIMIT; i += 1) {
      suggestions.seed(
        makeSuggestion('ready', { id: `old-${i}`, createdAt: new Date(now.getTime() - i * HOUR) })
      );
    }

    await expect(handler.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' })).rejects.toThrow(
      GenerationLimitExceededError
    );
  });

  it('третя за добу ще проходить', async () => {
    const { suggestions, handler } = buildLimitFixture();
    const now = testClock.now();
    for (let i = 0; i < DAILY_GENERATION_LIMIT - 1; i += 1) {
      suggestions.seed(
        makeSuggestion('ready', { id: `old-${i}`, createdAt: new Date(now.getTime() - i * HOUR) })
      );
    }

    await expect(
      handler.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' })
    ).resolves.toMatchObject({
      status: 'pending',
    });
  });

  it('failed-генерації не витрачають ліміт (AI-WEB-06)', async () => {
    const { suggestions, handler } = buildLimitFixture();
    for (let i = 0; i < 10; i += 1) {
      suggestions.seed(makeSuggestion('failed', { id: `f-${i}` }));
    }

    await expect(
      handler.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' })
    ).resolves.toBeTruthy();
  });

  it('генерації старше за 24 години не витрачають ліміт', async () => {
    const { suggestions, handler } = buildLimitFixture();
    const old = new Date(testClock.now().getTime() - 25 * HOUR);
    for (let i = 0; i < 5; i += 1) {
      suggestions.seed(makeSuggestion('ready', { id: `old-${i}`, createdAt: old }));
    }

    await expect(
      handler.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' })
    ).resolves.toBeTruthy();
  });

  it('ліміт рахується лише для власника', async () => {
    const { suggestions, handler } = buildLimitFixture();
    const now = testClock.now();
    for (let i = 0; i < 5; i += 1) {
      suggestions.seed(
        makeSuggestion('ready', {
          id: `other-${i}`,
          ownerId: 'someone-else',
          createdAt: new Date(now.getTime() - i * HOUR),
        })
      );
    }

    await expect(
      handler.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' })
    ).resolves.toBeTruthy();
  });
});
