// PurgeExpiredData (T-4490): один прохід крону — видалити прострочене за
// політикою, перевірити, що нічого не лишилось, і записати аудит. Legal hold
// пропускає набір повністю (але фіксується в аудиті як held).
import { RETENTION_RULES, cutoffFor, type RetentionAuditEntry, type RetentionRule } from './retention-policy';
import type { RetentionStore } from './retention.ports';

export interface PurgeDeps {
  store: RetentionStore;
  holds: ReadonlySet<string>;
  rules?: readonly RetentionRule[];
  audit?: (entry: RetentionAuditEntry) => void;
}

export interface PurgeResult {
  purged: Record<string, number>;
  total: number;
  remainingExpired: number;
}

export class PurgeExpiredData {
  constructor(private readonly deps: PurgeDeps) {}

  async execute(now: Date = new Date()): Promise<PurgeResult> {
    const rules = this.deps.rules ?? RETENTION_RULES;
    const purged: Record<string, number> = {};
    let total = 0;
    let remainingExpired = 0;
    for (const rule of rules) {
      const cutoff = cutoffFor(rule, now);
      const held = this.deps.holds.has(rule.dataset);
      const count = held ? 0 : await this.deps.store.purge(rule.dataset, cutoff);
      const remaining = await this.deps.store.remainingExpired(rule.dataset, cutoff);
      purged[rule.dataset] = count;
      total += count;
      remainingExpired += remaining;
      const entry: RetentionAuditEntry = {
        dataset: rule.dataset,
        cutoff: cutoff.toISOString(),
        purged: count,
        remainingExpired: remaining,
        held,
      };
      await this.deps.store.recordAudit(entry, now);
      this.deps.audit?.(entry);
    }
    return { purged, total, remainingExpired };
  }
}
