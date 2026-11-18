// GetSuggestionStatus — клієнт полліть статус генерації (AI-WEB-03). Відповідь
// залежить від стану: processing → без варіантів; ready → підписані URL;
// failed → машиночитний failureReason (клієнт показує зрозуміле текстове
// повідомлення, а не сирий помилковий рядок провайдера).

import { SuggestionNotFoundError } from './haircut-errors';
import { toVariantViews, type AiVariantView } from './ai-read-model';
import type {
  GenerationFailureReason,
  HaircutSuggestionRepository,
  PhotoStorage,
} from '../domain/ports';
import type { SuggestionStatus } from '../domain/haircut-suggestion';

export interface GetSuggestionStatusInput {
  suggestionId: string;
  ownerId: string;
}

export interface GetSuggestionStatusOutput {
  suggestionId: string;
  sourcePhotoId: string;
  status: SuggestionStatus;
  variantCount: number;
  variants: AiVariantView[];
  failureReason: GenerationFailureReason | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface GetSuggestionStatusDeps {
  suggestions: HaircutSuggestionRepository;
  storage: PhotoStorage;
}

export class GetSuggestionStatusHandler {
  constructor(private readonly deps: GetSuggestionStatusDeps) {}

  async handle(input: GetSuggestionStatusInput): Promise<GetSuggestionStatusOutput> {
    const { suggestions, storage } = this.deps;
    const suggestion = await suggestions.findById(input.suggestionId);
    // Чужое фото — те саме «не знайдено»: не підтверджуємо існування (ADR 0015 §2).
    if (!suggestion || suggestion.ownerId !== input.ownerId) {
      throw new SuggestionNotFoundError(input.suggestionId);
    }

    return {
      suggestionId: suggestion.id,
      sourcePhotoId: suggestion.sourcePhotoId,
      status: suggestion.status,
      variantCount: suggestion.propsData.variantCount,
      variants: suggestion.isReady ? await toVariantViews(storage, suggestion.variants) : [],
      failureReason: suggestion.failureReason,
      errorMessage: suggestion.errorMessage,
      createdAt: suggestion.createdAt.toISOString(),
    };
  }
}
