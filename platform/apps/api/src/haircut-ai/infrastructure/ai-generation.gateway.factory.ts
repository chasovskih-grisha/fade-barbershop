// Вибір ACL-адаптера (ADR 0008): env, не код. CI і тести не задають AI_PROVIDER — лишається fake.

import type { AiGenerationGateway } from '../domain/ports';

export function selectAiGenerationGateway(
  env: { AI_PROVIDER?: string | undefined },
  fake: AiGenerationGateway,
  gemini: AiGenerationGateway
): AiGenerationGateway {
  return env.AI_PROVIDER === 'gemini' ? gemini : fake;
}
