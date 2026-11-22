import { buildClientDataExport } from './data-export';
import {
  appendAuditRecord,
  verifyAuditChain,
  type AuditRecord,
  type PrivacyAuditEntry,
} from './privacy-audit';

function weakHash(value: string): string {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total * 31 + value.charCodeAt(index)) % 1_000_000_007;
  }
  return `h${total}`;
}

function entry(sequence: number, action: PrivacyAuditEntry['action']): PrivacyAuditEntry {
  return {
    sequence,
    action,
    subjectId: '11111111-1111-7111-8111-111111111111',
    occurredAt: new Date('2026-11-22T09:00:00Z'),
  };
}

describe('buildClientDataExport (T-5015)', () => {
  it('bundles every client section with counts and schema version', () => {
    const bundle = buildClientDataExport({
      clientId: '11111111-1111-7111-8111-111111111111',
      generatedAt: new Date('2026-11-22T09:00:00Z'),
      profile: { phone: '+380501112233' },
      appointments: [{ id: 'a1' }, { id: 'a2' }],
      payments: [{ id: 'p1' }],
      messages: [],
      consents: [{ channel: 'sms', granted: true }],
    });

    expect(bundle.schemaVersion).toBe('1.0');
    expect(bundle.counts).toEqual({ appointments: 2, payments: 1, messages: 0, consents: 1 });
    expect(bundle.sections.profile).toEqual({ phone: '+380501112233' });
  });
});

describe('privacy audit chain (T-5015)', () => {
  it('links each record to its predecessor and verifies the chain', () => {
    const first = appendAuditRecord([], entry(1, 'export'), weakHash);
    const chain = [first, appendAuditRecord([first], entry(2, 'erasure_requested'), weakHash)];

    expect(first.previousHash).toBe('genesis');
    expect(chain[1]?.previousHash).toBe(first.hash);
    expect(verifyAuditChain(chain, weakHash)).toBe(true);
    expect(verifyAuditChain([], weakHash)).toBe(true);
  });

  it('rejects tampered or reordered entries', () => {
    const first = appendAuditRecord([], entry(1, 'export'), weakHash);
    const chain: AuditRecord[] = [
      first,
      appendAuditRecord([first], entry(2, 'erasure_completed'), weakHash),
    ];
    const head = chain[0];
    const tail = chain[1];
    if (!head || !tail) throw new Error('expected a two-record chain');
    const tampered = [{ ...head, action: 'erasure_completed' as const }, tail];

    expect(verifyAuditChain(tampered, weakHash)).toBe(false);
    expect(verifyAuditChain([tail, head], weakHash)).toBe(false);
  });
});
