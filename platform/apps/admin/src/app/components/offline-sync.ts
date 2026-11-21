import type { OutboxMutation } from './offline-context';

export const OUTBOX_STORAGE_KEY = 'fade_admin_outbox';

function randomId(length: number): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

export function createMutation(url: string, method: string, body: unknown): OutboxMutation {
  return {
    id: randomId(7),
    url,
    method,
    body,
    idempotencyKey: `fade-idemp-${randomId(13)}${Date.now().toString(36)}`,
    timestamp: Date.now(),
    retries: 0,
  };
}

function headers(mutation: OutboxMutation): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Idempotency-Key': mutation.idempotencyKey,
    'X-Vector-Timestamp': String(mutation.timestamp),
  };
}

/** Returns the HTTP status, or null when the request could not reach the server. */
export async function sendMutation(mutation: OutboxMutation): Promise<number | null> {
  try {
    const response = await fetch(mutation.url, {
      method: mutation.method,
      headers: headers(mutation),
      body: JSON.stringify(mutation.body),
      credentials: 'include',
    });
    return response.ok ? 200 : response.status;
  } catch {
    return null;
  }
}

export function loadStoredOutbox(): OutboxMutation[] {
  try {
    const saved = localStorage.getItem(OUTBOX_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as OutboxMutation[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredOutbox(queue: OutboxMutation[]): void {
  try {
    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // storage unavailable — the in-memory queue still works
  }
}

export function clearStoredOutbox(): void {
  localStorage.removeItem(OUTBOX_STORAGE_KEY);
}
