// Офлайн-черга чату візиту (T-081a): повідомлення лягає на пристрій до
// відправки, а `clientMessageId` генерується один раз — реплей після
// відновлення мережі не плодить дубль на сервері.

import type { CacheStorage } from '../lib/offline-cache';

export interface QueuedMessage {
  clientMessageId: string;
  body: string;
  createdAt: string;
}

export interface ChatTransport {
  send(
    visitId: string,
    body: string,
    clientMessageId: string
  ): Promise<{ duplicate?: boolean }>;
}

export interface FlushResult {
  sent: QueuedMessage[];
  pending: QueuedMessage[];
  failed: boolean;
}

const keyFor = (visitId: string) => `chat-queue:${visitId}`;

export function createClientMessageId(now = Date.now(), random = Math.random): string {
  return `m-${now.toString(36)}-${random().toString(36).slice(2, 10)}`;
}

function isQueued(value: unknown): value is QueuedMessage {
  const entry = value as QueuedMessage | null;
  return (
    !!entry &&
    typeof entry.clientMessageId === 'string' &&
    typeof entry.body === 'string' &&
    typeof entry.createdAt === 'string'
  );
}

export async function loadQueue(storage: CacheStorage, visitId: string): Promise<QueuedMessage[]> {
  const raw = await storage.read(keyFor(visitId));
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isQueued) : [];
  } catch {
    return [];
  }
}

async function saveQueue(
  storage: CacheStorage,
  visitId: string,
  queue: QueuedMessage[]
): Promise<void> {
  await storage.write(keyFor(visitId), JSON.stringify(queue));
}

/** Ключ фіксується тут, до першої спроби надсилання. */
export async function enqueueMessage(
  storage: CacheStorage,
  visitId: string,
  body: string
): Promise<QueuedMessage> {
  const text = body.trim();
  if (!text) throw new Error('empty message');
  const entry: QueuedMessage = {
    clientMessageId: createClientMessageId(),
    body: text,
    createdAt: new Date().toISOString(),
  };
  await saveQueue(storage, visitId, [...(await loadQueue(storage, visitId)), entry]);
  return entry;
}

/** Перша мережева помилка зупиняє реплей: решта лишається в черзі як є. */
export async function flushQueue(
  storage: CacheStorage,
  visitId: string,
  transport: ChatTransport
): Promise<FlushResult> {
  const queue = await loadQueue(storage, visitId);
  const sent: QueuedMessage[] = [];
  const pending: QueuedMessage[] = [];
  let failed = false;
  for (const entry of queue) {
    if (failed) {
      pending.push(entry);
      continue;
    }
    try {
      await transport.send(visitId, entry.body, entry.clientMessageId);
      sent.push(entry);
    } catch {
      failed = true;
      pending.push(entry);
    }
  }
  await saveQueue(storage, visitId, pending);
  return { sent, pending, failed };
}
