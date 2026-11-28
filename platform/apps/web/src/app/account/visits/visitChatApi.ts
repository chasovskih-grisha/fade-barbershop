// Клієнт чату візиту (T-081b): GET/POST /messaging/visits/:visitId/messages.
// Сесія їде cookie, відправника сервер бере з неї; `clientMessageId` робить
// повторний надсилання ідемпотентним.

export type VisitChatMessage = {
  id: string;
  senderId: string;
  senderRole: 'client' | 'barber';
  body: string;
  clientMessageId: string | null;
  createdAt: string;
};

/** 403/404 — чужий або неіснуючий візит: UI показує «чат недоступний». */
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
  throw new Error(`API error ${res.status}`);
}

export function fetchVisitChat(visitId: string): Promise<VisitChatMessage[]> {
  return fetch(`/messaging/visits/${encodeURIComponent(visitId)}/messages`, {
    cache: 'no-store',
  })
    .then((res) => readJson<{ messages: VisitChatMessage[] }>(res))
    .then((data) => data.messages);
}

/** Ключ спроби: реплей з тим самим ключем не плодить друге повідомлення. */
export function newClientMessageId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function sendVisitChatMessage(
  visitId: string,
  body: string,
  clientMessageId: string
): Promise<{ message: VisitChatMessage; duplicate: boolean }> {
  return fetch(`/messaging/visits/${encodeURIComponent(visitId)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, clientMessageId }),
  }).then((res) => readJson<{ message: VisitChatMessage; duplicate: boolean }>(res));
}
