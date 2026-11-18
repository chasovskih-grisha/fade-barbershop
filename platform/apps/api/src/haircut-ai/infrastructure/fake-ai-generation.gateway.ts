// FakeAiGenerationGateway — фейк порту AiGenerationGateway (ADR 0019: те, що має
// фейк порту, не мокається всередині use case). Імітує асинхронного провайдера:
// submit() → jobHandle, poll() → processing N разів → ready з варіантами.
// Варіанти пишуться в НАШ бакет через PhotoStorage — так кабінет показує реальні
// підписані URL, а не зовнішні посилання.
//
// Керується env (для ручного тестування сценаріїв AI-ADM-04):
//   AI_PROVIDER=fake            — вибір адаптера (за замовчуванням fake)
//   AI_FAKE_POLLS=2             — скільки poll() дають processing
//   AI_FAKE_FAIL=1              — завершити failed замість ready
//   AI_FAKE_FAIL_REASON=unknown — invalid_photo|provider_timeout|provider_quota|unknown

import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import type {
  AiGenerationGateway,
  AiGenerationPoll,
  AiGenerationRequest,
  GenerationFailureReason,
  GeneratedVariant,
  PhotoStorage,
} from '../domain/ports';
import { fakeVariantSvg } from './fake-variant-image';

const DEFAULT_POLLS = 2;
const CONTENT_TYPE = 'image/svg+xml';

interface FakeJob {
  pollsLeft: number;
  variantCount: number;
  settled: AiGenerationPoll | null;
}

@Injectable()
export class FakeAiGenerationGateway implements AiGenerationGateway {
  private readonly jobs = new Map<string, FakeJob>();
  private readonly polls: number;
  private readonly shouldFail: boolean;
  private readonly failReason: GenerationFailureReason;

  constructor(private readonly storage: PhotoStorage) {
    this.polls = Number(process.env.AI_FAKE_POLLS ?? DEFAULT_POLLS);
    this.shouldFail = process.env.AI_FAKE_FAIL === '1';
    this.failReason = (process.env.AI_FAKE_FAIL_REASON as GenerationFailureReason) ?? 'unknown';
  }

  async submit(request: AiGenerationRequest): Promise<{ jobHandle: string }> {
    const jobHandle = `fake-job-${uuidv7()}`;
    this.jobs.set(jobHandle, {
      pollsLeft: this.polls,
      variantCount: request.variantCount,
      settled: null,
    });
    return { jobHandle };
  }

  async poll(jobHandle: string): Promise<AiGenerationPoll> {
    const job = this.jobs.get(jobHandle);
    if (!job)
      return { state: 'failed', reason: 'unknown', message: `Unknown job handle: ${jobHandle}` };
    if (job.settled) return job.settled;
    if (job.pollsLeft > 0) {
      job.pollsLeft -= 1;
      return { state: 'processing' };
    }
    const settled = this.shouldFail
      ? {
          state: 'failed' as const,
          reason: this.failReason,
          message: 'FakeAiGenerationGateway: forced failure',
        }
      : { state: 'ready' as const, variants: await this.renderVariants(job.variantCount) };
    job.settled = settled;
    return settled;
  }

  private async renderVariants(count: number): Promise<GeneratedVariant[]> {
    const variants: GeneratedVariant[] = [];
    for (let index = 0; index < count; index += 1) {
      const stored = await this.storage.put({
        bytes: fakeVariantSvg(index, count),
        contentType: CONTENT_TYPE,
        ownerId: 'ai-fake',
      });
      variants.push({ objectKey: stored.objectKey, contentType: CONTENT_TYPE });
    }
    return variants;
  }
}
