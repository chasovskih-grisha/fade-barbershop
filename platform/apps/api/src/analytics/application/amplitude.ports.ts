// Порти серверної аналітики (T-4587): транспорт Amplitude і сховище outbox.
import type { AmplitudeEvent } from '../domain/amplitude-events';

export const AMPLITUDE_TRANSPORT = 'AMPLITUDE_TRANSPORT';
export const AMPLITUDE_STORE = 'AMPLITUDE_STORE';

export interface StoredAmplitudeEvent {
  id: string;
  event: AmplitudeEvent;
  attempts: number;
}

export interface AmplitudeTransport {
  /** Надсилає батч; кидає помилку на non-2xx/таймаут (ретраї — у use case). */
  send(events: readonly AmplitudeEvent[]): Promise<void>;
}

export interface AmplitudeStore {
  /** Ідемпотентно переносить доменні події з OutboxMessage у свою чергу. */
  enqueueRecent(since: Date, limit: number): Promise<number>;
  pending(now: Date, limit: number): Promise<StoredAmplitudeEvent[]>;
  markSent(ids: readonly string[], now: Date): Promise<void>;
  /** nextAttemptAt=null → dead letter (спроби вичерпано). */
  markFailed(id: string, nextAttemptAt: Date | null, error: string): Promise<void>;
}
