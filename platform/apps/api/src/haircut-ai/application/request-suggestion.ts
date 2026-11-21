// RequestSuggestion — клієнт ініціює AI-генерацію за завантаженим фото
// (T-051, AI-WEB-01/02). Перевіряє: фото існує, належить власнику, живе, згода
// надана, добовий ліміт не вичерпано (AI-WEB-05, AI-ADM-03).
//
// Створює HaircutSuggestion у статусі pending і повертає suggestionId. Провайдер
// НЕ кликається з запиту: клієнт полліть статус окремим запитом (AI-WEB-03), а
// роботу робить AiGenerationWorker (понад HTTP-таймаут — ADR 0015 §1).

import {
  ConsentRequiredError,
  GenerationLimitExceededError,
  PhotoAlreadyDeletedError,
  SourcePhotoNotFoundError,
} from './haircut-errors';
import {
  HaircutSuggestion,
  VARIANT_COUNT_MAX,
  VARIANT_COUNT_MIN,
} from '../domain/haircut-suggestion';
import { DAILY_GENERATION_LIMIT, spentGenerations } from './daily-limit';
import type {
  Clock,
  HaircutSuggestionRepository,
  IdGenerator,
  SourcePhotoRepository,
  UnitOfWork,
} from '../domain/ports';

export { DAILY_GENERATION_LIMIT };

export interface RequestSuggestionInput {
  sourcePhotoId: string;
  ownerId: string;
  /** 3–4 (AI-WEB-04); за замовчуванням 4. */
  variantCount?: number;
}

export interface RequestSuggestionOutput {
  suggestionId: string;
  status: 'pending';
}

export interface RequestSuggestionDeps {
  photos: SourcePhotoRepository;
  suggestions: HaircutSuggestionRepository;
  clock: Clock;
  ids: IdGenerator;
  uow: UnitOfWork;
}

export class RequestSuggestionHandler {
  constructor(private readonly deps: RequestSuggestionDeps) {}

  async handle(input: RequestSuggestionInput): Promise<RequestSuggestionOutput> {
    const { photos, suggestions, clock, ids, uow } = this.deps;
    const variantCount = input.variantCount ?? VARIANT_COUNT_MAX;
    if (variantCount < VARIANT_COUNT_MIN || variantCount > VARIANT_COUNT_MAX) {
      throw new Error(
        `variantCount must be ${VARIANT_COUNT_MIN}..${VARIANT_COUNT_MAX} (AI-WEB-04)`
      );
    }

    return uow.run(async (): Promise<RequestSuggestionOutput> => {
      const photo = await photos.findById(input.sourcePhotoId);
      if (!photo || photo.ownerId !== input.ownerId)
        throw new SourcePhotoNotFoundError(input.sourcePhotoId);
      if (photo.isDeleted) throw new PhotoAlreadyDeletedError();
      if (!photo.canGenerate) throw new ConsentRequiredError();

      await assertWithinDailyLimit(suggestions, input.ownerId, clock.now());

      const suggestion = HaircutSuggestion.create({
        sourcePhotoId: input.sourcePhotoId,
        ownerId: input.ownerId,
        variantCount,
        clock,
        ids,
      });
      await suggestions.save(suggestion);
      return { suggestionId: suggestion.id, status: 'pending' };
    });
  }
}

/** Ліміт рахуємо лише по «витратних» генераціях: падіння провайдера
 *  (failed з provider_*) ліміт не витрачає (AI-WEB-06, AI-ADM-04). */
async function assertWithinDailyLimit(
  suggestions: HaircutSuggestionRepository,
  ownerId: string,
  now: Date
): Promise<void> {
  const all = await suggestions.findByOwnerId(ownerId);
  if (spentGenerations(all, now) >= DAILY_GENERATION_LIMIT) {
    throw new GenerationLimitExceededError(
      `Денний ліміт генерацій (${DAILY_GENERATION_LIMIT}) вичерпано. Спробуйте завтра.`
    );
  }
}
