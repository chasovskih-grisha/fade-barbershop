// GeminiAiGenerationGateway — ACL-адаптер порту AiGenerationGateway (ADR 0008).
// generateContent синхронний, тож submit() стартує роботу і одразу повертає handle,
// а poll() віддає processing, доки варіанти не ляжуть у НАШ бакет.

import { randomUUID } from 'node:crypto';
import type {
  AiGenerationGateway,
  AiGenerationPoll,
  AiGenerationRequest,
  GeneratedVariant,
  PhotoStorage,
} from '../domain/ports';
import { GeminiImageError } from './gemini-image.error';
import type { GeminiImageClient } from './gemini-image.client';
import { haircutPrompts } from './gemini-haircut.prompts';

interface GeminiJob {
  poll: AiGenerationPoll;
}

export class GeminiAiGenerationGateway implements AiGenerationGateway {
  private readonly jobs = new Map<string, GeminiJob>();

  constructor(
    private readonly storage: PhotoStorage,
    private readonly client: GeminiImageClient
  ) {}

  async submit(request: AiGenerationRequest): Promise<{ jobHandle: string }> {
    const jobHandle = `gemini-${randomUUID()}`;
    this.jobs.set(jobHandle, { poll: { state: 'processing' } });
    void this.run(jobHandle, request);
    return { jobHandle };
  }

  async poll(jobHandle: string): Promise<AiGenerationPoll> {
    return (
      this.jobs.get(jobHandle)?.poll ?? {
        state: 'failed',
        reason: 'unknown',
        message: `Unknown job handle: ${jobHandle}`,
      }
    );
  }

  private async run(jobHandle: string, request: AiGenerationRequest): Promise<void> {
    try {
      const source = await this.storage.read(request.sourcePhoto.objectKey);
      if (!source) {
        this.settle(jobHandle, {
          state: 'failed',
          reason: 'invalid_photo',
          message: 'Source photo is missing',
        });
        return;
      }
      const variants = await this.renderVariants(source, request.variantCount);
      this.settle(jobHandle, { state: 'ready', variants });
    } catch (error) {
      const reason = error instanceof GeminiImageError ? error.reason : 'unknown';
      const message = error instanceof Error ? error.message : 'Gemini request failed';
      this.settle(jobHandle, { state: 'failed', reason, message });
    }
  }

  private async renderVariants(
    source: { bytes: Uint8Array; contentType: string },
    count: number
  ): Promise<GeneratedVariant[]> {
    const variants: GeneratedVariant[] = [];
    for (const prompt of haircutPrompts(count)) {
      const image = await this.client.edit({
        bytes: source.bytes,
        contentType: source.contentType,
        prompt,
      });
      const stored = await this.storage.put({
        bytes: image.bytes,
        contentType: image.contentType,
        ownerId: 'ai-gemini',
      });
      variants.push({ objectKey: stored.objectKey, contentType: image.contentType });
    }
    return variants;
  }

  private settle(jobHandle: string, poll: AiGenerationPoll): void {
    const job = this.jobs.get(jobHandle);
    if (job) job.poll = poll;
  }
}
