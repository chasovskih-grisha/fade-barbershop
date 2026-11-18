// Стан рядка AI-генерації: типи й початковий набір полів. Окремо від
// поведінки агрегату (haircut-suggestion.ts) — файл тримає їх у межах
// max-lines (ADR 0019) і не тягне правила переходів.

import type { GeneratedVariant, GenerationFailureReason } from './ports';

export type SuggestionStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface HaircutSuggestionProps {
  id: string;
  sourcePhotoId: string;
  ownerId: string;
  status: SuggestionStatus;
  variantCount: number;
  variants: GeneratedVariant[];
  failureReason: GenerationFailureReason | null;
  errorMessage: string | null;
  providerJobHandle: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  failedAt: Date | null;
}

export const VARIANT_COUNT_MIN = 3;
export const VARIANT_COUNT_MAX = 4;

/** Поля нового рядка: pending, без варіантів і без job handle. */
export function freshSuggestionState(
  now: Date
): Omit<HaircutSuggestionProps, 'id' | 'sourcePhotoId' | 'ownerId' | 'variantCount'> {
  return {
    status: 'pending',
    variants: [],
    failureReason: null,
    errorMessage: null,
    providerJobHandle: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    failedAt: null,
  };
}
