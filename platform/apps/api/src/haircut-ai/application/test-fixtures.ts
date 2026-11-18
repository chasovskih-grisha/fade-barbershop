// Конструктори доменних об'єктів для тестів haircut-ai: Photo з мінімальними
// метаданими та рядки генерацій у потрібному статусі. Спільні для всіх
// специфікацій контексту, щоб кожна тестована умова лишалася в своєму файлі
// (гейт max-lines).

import { SourcePhoto } from '../domain/source-photo';
import { HaircutSuggestion, type SuggestionStatus } from '../domain/haircut-suggestion';
import type { GeneratedVariant } from '../domain/ports';

export const TEST_NOW = new Date('2026-03-01T10:00:00.000Z');
export const TEST_LATER = new Date('2026-03-01T11:00:00.000Z');

export const VARIANT_KEYS = ['user-1/variants/1.svg', 'user-1/variants/2.svg'] as const;

export const testClock = { now: () => TEST_NOW };

export function makeVariants(count = VARIANT_KEYS.length): GeneratedVariant[] {
  return Array.from({ length: count }, (_, i) => ({
    objectKey: `user-1/variants/${i + 1}.svg`,
    contentType: 'image/svg+xml',
  }));
}

export function makePhoto(
  over: Partial<Parameters<typeof SourcePhoto.reconstitute>[0]> = {}
): SourcePhoto {
  return SourcePhoto.reconstitute({
    id: 'photo-1',
    ownerId: 'user-1',
    objectKey: 'user-1/photo.jpg',
    bucket: 'haircut-ai-photos',
    contentType: 'image/jpeg',
    sizeBytes: 2048,
    consentGranted: true,
    consentGrantedAt: TEST_NOW,
    consentRevokedAt: null,
    createdAt: TEST_NOW,
    updatedAt: TEST_NOW,
    deletedAt: null,
    ...over,
  });
}

export function makeSuggestion(
  status: SuggestionStatus = 'pending',
  over: Partial<Parameters<typeof HaircutSuggestion.reconstitute>[0]> = {}
): HaircutSuggestion {
  const terminal = status === 'ready' || status === 'failed';
  return HaircutSuggestion.reconstitute({
    id: 'sug-1',
    sourcePhotoId: 'photo-1',
    ownerId: 'user-1',
    status,
    variantCount: VARIANT_KEYS.length,
    variants: status === 'ready' ? makeVariants() : [],
    failureReason: null,
    errorMessage: null,
    providerJobHandle: status === 'processing' ? 'job-1' : null,
    createdAt: TEST_NOW,
    updatedAt: TEST_NOW,
    completedAt: terminal ? TEST_NOW : null,
    failedAt: null,
    ...over,
  });
}
