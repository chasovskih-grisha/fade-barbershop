// Метадані одного ходу агента (T-280a): коли, з якого каналу і з яким
// наміром-кандидатом. Намір тут — лише мітка для класифікатора слайсу c;
// рішення ухвалює домен, не промпт (ADR 0020 §4).

import type { AgentChannel } from './agent-message';

export interface AgentTurn {
  conversationId: string;
  channel: AgentChannel;
  /** Нормалізований намір-кандидат; null — класифікатор ще не відповів. */
  intent: string | null;
  at: Date;
}

export const INTENT_LIMIT = 64;

/** Хід агента з формою, яку домен не приймає. */
export class InvalidAgentTurnError extends Error {
  constructor(readonly field: string) {
    super(`Invalid agent turn: ${field}`);
    this.name = 'InvalidAgentTurnError';
  }
}

export function agentTurnProblem(turn: AgentTurn): string | null {
  if (turn.conversationId.length === 0) return 'conversationId is empty';
  if (!(turn.at instanceof Date) || Number.isNaN(turn.at.getTime())) return 'at is not a date';
  if (turn.intent === null) return null;
  if (turn.intent.trim().length === 0) return 'intent is empty';
  if (turn.intent.length > INTENT_LIMIT) return 'intent is too long';
  return null;
}

export function assertAgentTurn(turn: AgentTurn): void {
  const problem = agentTurnProblem(turn);
  if (problem !== null) throw new InvalidAgentTurnError(problem);
}

/** Намір-кандидат у порівнюваній формі: «Book Slot» → `book_slot`. */
export function normalizeIntent(intent: string): string {
  return intent
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}
