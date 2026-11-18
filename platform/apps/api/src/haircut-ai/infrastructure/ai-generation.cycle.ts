// Один цикл AI-генерації (T-050): дві фази, кожна у власній транзакції.
//
//   pending    → gateway.submit() → startProcessing(jobHandle)
//   processing → gateway.poll()  → complete() | fail()
//
// Фази в одному проході: щойно submit-нуті рядки встигнуть дозріти до
// наступного poll, тож клієнт бачить pending лише один-два тіки.
//
// Провайдер лишається поза транзакцією (мережевий виклик у UoW тримав би
// з'єднання): спершу submit/poll, потім коротка транзакція запису.

import type { AiGenerationRequest } from '../domain/ports';
import type { AiGenerationCycleDeps, TickReport } from './ai-generation.cycle.types';

export type { AiGenerationCycleDeps, TickReport } from './ai-generation.cycle.types';

export class AiGenerationCycle {
  constructor(private readonly deps: AiGenerationCycleDeps) {}

  async run(): Promise<TickReport> {
    return { submitted: await this.submitPending(), settled: await this.pollProcessing() };
  }

  /** Phase 1: pending → processing (провайдер прийняв job). */
  private async submitPending(): Promise<number> {
    const { suggestions, clock, outbox } = this.deps;
    let submitted = 0;
    for (const suggestion of await suggestions.findByStatuses(['pending'])) {
      const photo = await this.deps.photos.findById(suggestion.sourcePhotoId);
      // Фото могли видалити або відкликати згоду після запиту — тоді пропускаємо.
      if (!photo || !photo.canGenerate) continue;
      const jobHandle = await this.trySubmit({
        suggestionId: suggestion.id,
        sourcePhoto: { objectKey: photo.objectKey, contentType: photo.contentType },
        variantCount: suggestion.propsData.variantCount,
      });
      if (!jobHandle) {
        await this.persist(() => {
          const event = suggestion.fail(clock, 'unknown', 'Не вдалося передати запит провайдеру');
          return suggestions.save(suggestion).then(() => outbox.append([event]));
        });
        continue;
      }
      await this.persist(() => {
        suggestion.startProcessing(clock, jobHandle);
        return suggestions.save(suggestion);
      });
      submitted += 1;
    }
    return submitted;
  }

  /** Phase 2: processing → ready | failed (термінальні стани). */
  private async pollProcessing(): Promise<number> {
    const { suggestions, clock, outbox } = this.deps;
    let settled = 0;
    for (const suggestion of await suggestions.findByStatuses(['processing'])) {
      const handle = suggestion.providerJobHandle;
      if (!handle) continue;
      const result = await this.tryPoll(handle);
      if (!result || result.state === 'processing') continue;
      await this.persist(() => {
        const event =
          result.state === 'ready'
            ? suggestion.complete(clock, result.variants)
            : suggestion.fail(clock, result.reason, result.message);
        return suggestions.save(suggestion).then(() => outbox.append([event]));
      });
      settled += 1;
    }
    return settled;
  }

  /** Submit не прийнято (помилка мережі/провайдера) — повертаємо null. */
  private async trySubmit(request: AiGenerationRequest): Promise<string | null> {
    try {
      const { jobHandle } = await this.deps.gateway.submit(request);
      return jobHandle;
    } catch {
      return null;
    }
  }

  /** Мережева помилка опитування — лишаємо processing: наступний тік ще раз. */
  private async tryPoll(handle: string) {
    try {
      return await this.deps.gateway.poll(handle);
    } catch {
      return null;
    }
  }

  private async persist(work: () => Promise<void>): Promise<void> {
    await this.deps.uow.run(work);
  }
}
