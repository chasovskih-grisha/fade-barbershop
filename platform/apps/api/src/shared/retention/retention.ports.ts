// Порти утримання (T-4490): use case не знає про Prisma, аудит — окремий
// інтерфейс, щоб тести бачили ті самі записи, що й прод-таблиця.
import type { RetentionAuditEntry, RetentionDataset } from './retention-policy';

export const RETENTION_STORE = 'RETENTION_STORE';

export interface RetentionStore {
  /** Видаляє все, що старше за cutoff; повертає кількість рядків. */
  purge(dataset: RetentionDataset, cutoff: Date): Promise<number>;
  /** Пост-перевірка: чи справді нічого простроченого не лишилось. */
  remainingExpired(dataset: RetentionDataset, cutoff: Date): Promise<number>;
  /** Аудит-рядок переживає рестарти: пишемо в БД, не лише в лог. */
  recordAudit(entry: RetentionAuditEntry, at: Date): Promise<void>;
}
