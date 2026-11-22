/** Write-once, hash-chained privacy audit trail (T-5015). */

export type PrivacyAction =
  | 'export'
  | 'erasure_requested'
  | 'erasure_completed'
  | 'erasure_rejected';

export interface PrivacyAuditEntry {
  readonly sequence: number;
  readonly action: PrivacyAction;
  readonly subjectId: string;
  readonly occurredAt: Date;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface AuditRecord extends PrivacyAuditEntry {
  readonly previousHash: string;
  readonly hash: string;
}

export type HashFn = (value: string) => string;

const GENESIS = 'genesis';

function auditPayload(entry: PrivacyAuditEntry): string {
  return JSON.stringify({
    sequence: entry.sequence,
    action: entry.action,
    subjectId: entry.subjectId,
    occurredAt: entry.occurredAt.toISOString(),
    details: entry.details ?? {},
  });
}

/** Appends a record whose hash covers both the entry and the previous hash. */
export function appendAuditRecord(
  chain: readonly AuditRecord[],
  entry: PrivacyAuditEntry,
  hash: HashFn
): AuditRecord {
  const previousHash = chain[chain.length - 1]?.hash ?? GENESIS;
  return {
    ...entry,
    previousHash,
    hash: hash(`${previousHash}|${auditPayload(entry)}`),
  };
}

/** Detects reordering, insertion or mutation anywhere in the chain. */
export function verifyAuditChain(chain: readonly AuditRecord[], hash: HashFn): boolean {
  let previous = GENESIS;
  for (const record of chain) {
    if (record.previousHash !== previous) return false;
    if (record.hash !== hash(`${previous}|${auditPayload(record)}`)) return false;
    previous = record.hash;
  }
  return true;
}
