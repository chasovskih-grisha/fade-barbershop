// Переходи статусу HaircutSuggestion (complete / fail) — окремо від агрегату
// (гейт max-lines / complexity).

import type { GeneratedVariant, GenerationFailureReason, Clock } from './ports';
import { VARIANT_COUNT_MAX, type HaircutSuggestionProps } from './haircut-suggestion-props';
import { SuggestionFailed, SuggestionGenerated } from './events';

export function completeSuggestion(
  props: HaircutSuggestionProps,
  clock: Clock,
  variants: GeneratedVariant[]
): SuggestionGenerated {
  if (props.status !== 'processing') throw new Error(`Cannot complete from ${props.status}`);
  if (variants.length === 0) throw new Error('At least one variant required');
  if (variants.length > VARIANT_COUNT_MAX) {
    throw new Error(`Maximum ${VARIANT_COUNT_MAX} variants allowed (AI-WEB-04)`);
  }
  const now = clock.now();
  props.status = 'ready';
  props.variants = [...variants];
  props.completedAt = now;
  props.updatedAt = now;
  return new SuggestionGenerated({
    suggestionId: props.id,
    sourcePhotoId: props.sourcePhotoId,
    ownerId: props.ownerId,
    variants: [...variants],
    occurredAt: now,
  });
}

export function failSuggestion(
  props: HaircutSuggestionProps,
  input: { clock: Clock; reason: GenerationFailureReason; errorMessage?: string }
): SuggestionFailed {
  const status = props.status;
  if (status !== 'processing' && status !== 'pending')
    throw new Error(`Cannot fail from ${status}`);
  const now = input.clock.now();
  props.status = 'failed';
  props.failureReason = input.reason;
  props.errorMessage = input.errorMessage ?? null;
  props.failedAt = now;
  props.updatedAt = now;
  return new SuggestionFailed({
    suggestionId: props.id,
    sourcePhotoId: props.sourcePhotoId,
    ownerId: props.ownerId,
    failureReason: input.reason,
    ...(input.errorMessage ? { errorMessage: input.errorMessage } : {}),
    occurredAt: now,
  });
}
