import type { GenerationFailureReason } from '../domain/ports';

export class GeminiImageError extends Error {
  constructor(
    readonly reason: GenerationFailureReason,
    message: string
  ) {
    super(message);
  }
}
