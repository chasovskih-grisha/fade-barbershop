// Добовий ліміт генерацій (AI-WEB-05, AI-ADM-03): 3 на добу на клієнта.
// Правило одне для request і для кабінту — інакше лічильники розходяться.
//
// Падіння провайдера (статус failed) ліміт НЕ витрачає: клієнт не отримав
// результату (AI-WEB-06, AI-ADM-04).

import type { SuggestionStatus } from '../domain/haircut-suggestion';

export const DAILY_GENERATION_LIMIT = 3;
const LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface GenerationSpend {
  status: SuggestionStatus;
  createdAt: Date;
}

export function spentGenerations(spend: readonly GenerationSpend[], now: Date): number {
  const windowStart = new Date(now.getTime() - LIMIT_WINDOW_MS);
  return spend.filter((item) => item.status !== 'failed' && item.createdAt >= windowStart).length;
}

export function remainingGenerations(spend: readonly GenerationSpend[], now: Date): number {
  return Math.max(0, DAILY_GENERATION_LIMIT - spentGenerations(spend, now));
}
