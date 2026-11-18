// Мапінг рядка Prisma → пропси агрегату. variants — JSONB, тому на вході
// парсяться і валідуються: биті варіанти не піднімаються в домен (клієнт
// побачив би порожню галерею без діагностики).

import type { HaircutSuggestionProps, SuggestionStatus } from '../domain/haircut-suggestion';
import type { GeneratedVariant, GenerationFailureReason } from '../domain/ports';

const STATUSES: readonly SuggestionStatus[] = ['pending', 'processing', 'ready', 'failed'];
const FAILURE_REASONS: readonly GenerationFailureReason[] = [
  'invalid_photo',
  'provider_timeout',
  'provider_quota',
  'unknown',
];

export interface SuggestionRow {
  id: string;
  sourcePhotoId: string;
  ownerId: string;
  status: string;
  variantCount: number;
  variants: unknown;
  failureReason: string | null;
  errorMessage: string | null;
  providerJobHandle: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  failedAt: Date | null;
}

export function mapSuggestion(row: SuggestionRow): HaircutSuggestionProps {
  const status = STATUSES.includes(row.status as SuggestionStatus)
    ? (row.status as SuggestionStatus)
    : 'failed';
  const reason = FAILURE_REASONS.includes(row.failureReason as GenerationFailureReason)
    ? (row.failureReason as GenerationFailureReason)
    : null;
  return {
    id: row.id,
    sourcePhotoId: row.sourcePhotoId,
    ownerId: row.ownerId,
    status,
    variantCount: row.variantCount,
    variants: parseVariants(row.variants),
    failureReason: reason,
    errorMessage: row.errorMessage,
    providerJobHandle: row.providerJobHandle,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt,
    failedAt: row.failedAt,
  };
}

/** JSONB → варіанти; не-об'єкти/без objectKey відкидаються (галерея, а не 500). */
function parseVariants(raw: unknown): GeneratedVariant[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const { objectKey, contentType } = item as Record<string, unknown>;
    if (typeof objectKey !== 'string' || objectKey.length === 0) return [];
    return [
      { objectKey, contentType: typeof contentType === 'string' ? contentType : 'image/jpeg' },
    ];
  });
}
