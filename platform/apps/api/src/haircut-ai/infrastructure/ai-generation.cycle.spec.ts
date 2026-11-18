// Тести циклу генерації (T-050, AI-WEB-03) на фейк-провайдері: повний шлях
// pending → submit → processing → poll → ready. Без БД і бакета.

import { buildCycle } from './cycle-test-fixtures';
import { makePhoto, makeSuggestion } from '../application/test-fixtures';

describe('AiGenerationCycle — успішний шлях (AI-WEB-03)', () => {
  let ctx: ReturnType<typeof buildCycle>;

  beforeEach(() => {
    ctx = buildCycle();
  });
  afterEach(() => ctx.restore());

  it('повний шлях: pending → submit → processing → poll → ready', async () => {
    ctx.photos.seed(makePhoto());
    ctx.suggestions.seed(makeSuggestion('pending'));

    const first = await ctx.cycle.run();
    const second = await ctx.cycle.run();

    expect(first.submitted).toBe(1);
    expect(second.settled).toBe(1);
    const ready = ctx.suggestions.rows.get('sug-1');
    expect(ready?.status).toBe('ready');
    expect(ready?.variants).toHaveLength(2);
  });

  it('провайдер не готовий миттєво — клієнт бачить processing без варіантів', async () => {
    ctx.photos.seed(makePhoto());
    ctx.suggestions.seed(makeSuggestion('pending'));

    await ctx.cycle.run();

    expect(ctx.suggestions.rows.get('sug-1')?.status).toBe('processing');
    expect(ctx.suggestions.rows.get('sug-1')?.variants).toEqual([]);
  });

  it('варіанти живуть у НАШОМУ бакеті, подія SuggestionGenerated у outbox', async () => {
    ctx.photos.seed(makePhoto());
    ctx.suggestions.seed(makeSuggestion('pending'));

    await ctx.cycle.run();
    await ctx.cycle.run();

    expect(ctx.storage.objects.size).toBe(2);
    expect(ctx.outbox.types()).toContain('haircut-ai.suggestion.generated');
  });

  it('готовий рядок більше не опитується (термінальний)', async () => {
    ctx.photos.seed(makePhoto());
    ctx.suggestions.seed(makeSuggestion('pending'));
    await ctx.cycle.run();
    await ctx.cycle.run();

    expect(await ctx.cycle.run()).toEqual({ submitted: 0, settled: 0 });
  });
});
