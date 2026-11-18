// Відмови й збої циклу генерації (T-050, AI-WEB-06): фото без згоди, фейл
// провайдера, недоступний провайдер. Інваріант: цикл не падає й не лишає
// рядок назавжди в pending.

import { buildCycle } from './cycle-test-fixtures';
import { makePhoto, makeSuggestion, testClock } from '../application/test-fixtures';

describe('AiGenerationCycle — відмова за згодою', () => {
  it('фото без згоди: submit пропускається, рядок лишається pending', async () => {
    const ctx = buildCycle();
    try {
      ctx.photos.seed(makePhoto({ consentGranted: false, consentGrantedAt: null }));
      ctx.suggestions.seed(makeSuggestion('pending'));

      expect(await ctx.cycle.run()).toEqual({ submitted: 0, settled: 0 });
      expect(ctx.suggestions.rows.get('sug-1')?.status).toBe('pending');
    } finally {
      ctx.restore();
    }
  });

  it('видалене фото: submit пропускається', async () => {
    const ctx = buildCycle();
    try {
      ctx.photos.seed(makePhoto({ deletedAt: testClock.now() }));
      ctx.suggestions.seed(makeSuggestion('pending'));

      expect((await ctx.cycle.run()).submitted).toBe(0);
    } finally {
      ctx.restore();
    }
  });

  it('фото зникло між запитом і тіком — цикл не ламається', async () => {
    const ctx = buildCycle();
    try {
      ctx.suggestions.seed(makeSuggestion('pending'));
      expect(await ctx.cycle.run()).toEqual({ submitted: 0, settled: 0 });
    } finally {
      ctx.restore();
    }
  });
});

describe('AiGenerationCycle — збої провайдера (AI-WEB-06)', () => {
  it('провайдер повертає failed: рядок failed із причиною, подія SuggestionFailed', async () => {
    const ctx = buildCycle({
      AI_FAKE_POLLS: '0',
      AI_FAKE_FAIL: '1',
      AI_FAKE_FAIL_REASON: 'provider_quota',
    });
    try {
      ctx.photos.seed(makePhoto());
      ctx.suggestions.seed(makeSuggestion('pending'));

      await ctx.cycle.run();

      const failed = ctx.suggestions.rows.get('sug-1');
      expect(failed?.status).toBe('failed');
      expect(failed?.failureReason).toBe('provider_quota');
      expect(ctx.outbox.types()).toContain('haircut-ai.suggestion.failed');
    } finally {
      ctx.restore();
    }
  });

  it('submit кинув помилку: failed, а не завислий pending', async () => {
    const ctx = buildCycle();
    try {
      ctx.photos.seed(makePhoto());
      ctx.suggestions.seed(makeSuggestion('pending'));
      ctx.gateway.submit = async () => {
        throw new Error('provider 503');
      };

      expect(await ctx.cycle.run()).toEqual({ submitted: 0, settled: 0 });
      expect(ctx.suggestions.rows.get('sug-1')?.status).toBe('failed');
      expect(ctx.suggestions.rows.get('sug-1')?.failureReason).toBe('unknown');
    } finally {
      ctx.restore();
    }
  });

  it('помилка poll лишає processing — наступний тік спробує ще', async () => {
    const ctx = buildCycle();
    try {
      ctx.photos.seed(makePhoto());
      ctx.suggestions.seed(makeSuggestion('processing'));
      ctx.gateway.poll = async () => {
        throw new Error('timeout');
      };

      expect((await ctx.cycle.run()).settled).toBe(0);
      expect(ctx.suggestions.rows.get('sug-1')?.status).toBe('processing');
    } finally {
      ctx.restore();
    }
  });
});
