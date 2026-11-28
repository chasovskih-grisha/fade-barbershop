// HTTP-клієнт чату візиту в mobile (T-081a): ті самі маршрути, що на web.
// 403/404 — чужий або неіснуючий візит, екран показує «чат недоступний».

import { apiBase } from '../lib/api/api-base';

export interface VisitChatMessage {
  id: string;
  senderId: string;
  senderRole: 'client' | 'barber';
  body: string;
  clientMessageId: string | null;
  createdAt: string;
}

export class VisitChatUnavailable extends Error {
  constructor(status: number) {
    super(`chat unavailable ${status}`);
    this.name = 'VisitChatUnavailable';
  }
}

const UNAVAILABLE = new Set([403, 404]);

async function readJson<T>(res: Response): Promise<T> {
  if (res.ok) return (await res.json()) as T;
  if (UNAVAILABLE.has(res.status)) throw new VisitChatUnavailable(res.status);
  throw new Error(`API ${res.status}`);
}

export async function fetchVisitChat(visitId: string): Promise<VisitChatMessage[]> {
  const res = await fetch(`${apiBase()}/messaging/visits/${encodeURIComponent(visitId)}/messages`, {
    credentials: 'include',
  });
  const data = await readJson<{ messages: VisitChatMessage[] }>(res);
  return data.messages;
}

export async function sendVisitChatMessage(
  visitId: string,
  body: string,
  clientMessageId: string
): Promise<{ message: VisitChatMessage; duplicate: boolean }> {
  const res = await fetch(`${apiBase()}/messaging/visits/${encodeURIComponent(visitId)}/messages`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, clientMessageId }),
  });
  return readJson<{ message: VisitChatMessage; duplicate: boolean }>(res);
}
