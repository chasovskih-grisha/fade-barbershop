// Порти розподіленого лока (T-4802). Application знає лише ці інтерфейси;
// Redis і in-memory — взаємозамінні адаптери.
export const SLOT_LOCK_STORE = 'SLOT_LOCK_STORE';
export const SLOT_LOCK_AUDIT = 'SLOT_LOCK_AUDIT';

export interface SlotLockStore {
  /** Атомарно взяти лок: true лише для одного володаря на весь кластер. */
  acquire(key: string, token: string, ttlMs: number): Promise<boolean>;
  /** Звільнити лише свій лок (compare-and-delete), інакше false. */
  release(key: string, token: string): Promise<boolean>;
  /** Поточний володар лока або null (для перевірки токена резервації). */
  find(key: string): Promise<string | null>;
}

export type SlotLockAuditType = 'timeout' | 'release_failed' | 'acquire_failed';

export interface SlotLockAuditEvent {
  type: SlotLockAuditType;
  key: string;
  attempts: number;
  detail?: string;
}

/** Аудит локів: таймаути взяття й невдалі звільнення не мають губитися. */
export interface SlotLockAudit {
  record(event: SlotLockAuditEvent): void;
}

/** Лок, який тримають навколо створення запису: свій токен або ефемерний. */
export interface HeldSlot {
  reserved?: { key: string; token: string };
  ephemeral?: import('../domain/slot-reservation').SlotReservation;
}
