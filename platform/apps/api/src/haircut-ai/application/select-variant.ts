// SelectVariant — клієнт обрав варіант із AI-генерації (REF-WEB-02). Перевіряє,
// що генерація готова, варіант належить саме їй, а фото — власнику. Публікує
// VariantSelected: споживач (scheduling) створює HaircutReference на запис.
// Обраний варіант повертається з підписаним URL — ним клієнт ділиться в чаті.

import { SuggestionNotFoundError, InvalidGenerationStatusError, VariantNotFoundError } from './haircut-errors';
import { toVariantViews, type AiVariantView } from './ai-read-model';
import { VariantSelected } from '../domain/events';
import type {
  Clock,
  HaircutSuggestionRepository,
  Outbox,
  PhotoStorage,
  UnitOfWork,
} from '../domain/ports';

export interface SelectVariantInput {
  suggestionId: string;
  ownerId: string;
  variantObjectKey: string;
  appointmentId?: string;
}

export interface SelectVariantOutput {
  success: true;
  variant: AiVariantView;
}

export interface SelectVariantDeps {
  suggestions: HaircutSuggestionRepository;
  storage: PhotoStorage;
  outbox: Outbox;
  clock: Clock;
  uow: UnitOfWork;
}

export class SelectVariantHandler {
  constructor(private readonly deps: SelectVariantDeps) {}

  async handle(input: SelectVariantInput): Promise<SelectVariantOutput> {
    const { suggestions, storage, outbox, clock, uow } = this.deps;

    return uow.run(async (): Promise<SelectVariantOutput> => {
      const suggestion = await suggestions.findById(input.suggestionId);
      if (!suggestion || suggestion.ownerId !== input.ownerId) {
        throw new SuggestionNotFoundError(input.suggestionId);
      }
      if (!suggestion.isReady) {
        throw new InvalidGenerationStatusError(
          `Обрати варіант можна лише після генерації (статус: ${suggestion.status})`
        );
      }

      const variant = suggestion.variants.find((v) => v.objectKey === input.variantObjectKey);
      if (!variant) throw new VariantNotFoundError(input.variantObjectKey);

      const event = new VariantSelected({
        suggestionId: suggestion.id,
        sourcePhotoId: suggestion.sourcePhotoId,
        ownerId: suggestion.ownerId,
        selectedVariant: variant,
        occurredAt: clock.now(),
      });
      await outbox.append([event]);

      const [view] = await toVariantViews(storage, [variant]);
      return { success: true, variant: view ?? { ...variant, url: '' } };
    });
  }
}
