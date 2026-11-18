// Доменні події haircut-ai. Імена — за конвенцією packages/contracts/events/README.md
// (минулий час, `context.entity.action`). Outbox-реле читає type + payload (T-042).

import type { GeneratedVariant } from './ports';

export abstract class DomainEvent {
  abstract readonly type: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  abstract readonly payload: Record<string, unknown>;

  constructor(params: { occurredAt: Date; aggregateId: string }) {
    this.occurredAt = params.occurredAt;
    this.aggregateId = params.aggregateId;
  }
}

/** Payload події без службового occurredAt — outbox-реле пише саме його. */
function payloadOf<T extends { occurredAt: Date }>(params: T): Omit<T, 'occurredAt'> {
  const entries = Object.entries(params).filter(([key]) => key !== 'occurredAt');
  return Object.fromEntries(entries) as Omit<T, 'occurredAt'>;
}

/** Подія в outbox: payload і агрегат спільні, type кожна подія означує сама. */
abstract class OutboxEvent<P extends Record<string, unknown>> extends DomainEvent {
  readonly payload: P;

  protected constructor(params: P & { occurredAt: Date }, aggregateId: string) {
    super({ occurredAt: params.occurredAt, aggregateId });
    this.payload = payloadOf(params) as unknown as P;
  }
}

// prettier-ignore
type PhotoUploadedPayload = { sourcePhotoId: string; ownerId: string; objectKey: string; contentType: string; sizeBytes: number };
/** Фото клієнта завантажено (T-043 → фаза 10). Master-копія — в нашому бакеті. */
export class PhotoUploaded extends OutboxEvent<PhotoUploadedPayload> {
  readonly type = 'haircut-ai.photo.uploaded';
  constructor(params: PhotoUploadedPayload & { occurredAt: Date }) {
    super(params, params.sourcePhotoId);
  }
}

// prettier-ignore
type ConsentChangedPayload = { sourcePhotoId: string; ownerId: string; granted: boolean };
/** Згода на AI-генерацію надана/відкликана (AI-WEB-02, AI-WEB-07). */
export class ConsentChanged extends OutboxEvent<ConsentChangedPayload> {
  readonly type = 'haircut-ai.consent.changed';
  constructor(params: ConsentChangedPayload & { occurredAt: Date }) {
    super(params, params.sourcePhotoId);
  }
}

// prettier-ignore
type PhotoDeletedPayload = { sourcePhotoId: string; reason: string; objectKeys: string[] };
/** Фото/варіанти видалені (AI-WEB-07, AI-ADM-06 — ретеншен 12 міс). */
export class PhotoDeleted extends OutboxEvent<PhotoDeletedPayload> {
  readonly type = 'haircut-ai.photo.deleted';
  constructor(params: PhotoDeletedPayload & { occurredAt: Date }) {
    super(params, params.sourcePhotoId);
  }
}

// prettier-ignore
type SuggestionGeneratedPayload = { suggestionId: string; sourcePhotoId: string; ownerId: string; variants: GeneratedVariant[] };
/** AI-генерація завершена (AI-WEB-04): варіанти вже ре-хостені у НАШ бакет. */
export class SuggestionGenerated extends OutboxEvent<SuggestionGeneratedPayload> {
  readonly type = 'haircut-ai.suggestion.generated';
  constructor(params: SuggestionGeneratedPayload & { occurredAt: Date }) {
    super(params, params.suggestionId);
  }
}

// prettier-ignore
type SuggestionFailedPayload = { suggestionId: string; sourcePhotoId: string; ownerId: string; failureReason: string; errorMessage?: string };
/** Генерація впала (AI-ADM-04). failed — термінальний: нова спроба = новий рядок. */
export class SuggestionFailed extends OutboxEvent<SuggestionFailedPayload> {
  readonly type = 'haircut-ai.suggestion.failed';
  constructor(params: SuggestionFailedPayload & { occurredAt: Date }) {
    super(params, params.suggestionId);
  }
}

// prettier-ignore
type VariantSelectedPayload = { suggestionId: string; sourcePhotoId: string; ownerId: string; selectedVariant: GeneratedVariant };
/** Клієнт обрав варіант (REF-WEB-02) — споживач створює HaircutReference. */
export class VariantSelected extends OutboxEvent<VariantSelectedPayload> {
  readonly type = 'haircut-ai.variant.selected';
  constructor(params: VariantSelectedPayload & { occurredAt: Date }) {
    super(params, params.suggestionId);
  }
}
