import { refundNote } from '../deposit-summary';

function visit(refund?: { status: 'pending' | 'processing' | 'completed' | 'failed'; amount: number }) {
  return {
    deposit: {
      amount: 210,
      freeCancelUntil: '2026-12-01T08:00:00.000Z',
      ...(refund ? { refund } : {}),
    },
  } as never;
}

describe('refundNote (T-094)', () => {
  it('мовчить про повернення, якого не було', () => {
    expect(refundNote(visit())).toBeNull();
    expect(refundNote({ deposit: null })).toBeNull();
  });

  it('називає суму, коли повернення в дорозі', () => {
    const note = refundNote(visit({ status: 'processing', amount: 210 }));

    expect(note).toContain('у дорозі');
    expect(note).toContain('210');
  });

  it('підтверджує повернуті гроші', () => {
    const note = refundNote(visit({ status: 'completed', amount: 210 }));

    expect(note).toContain('повернено');
  });

  it('не вдає, що повернення пройшло, коли воно зірвалося', () => {
    const note = refundNote(visit({ status: 'failed', amount: 210 }));

    expect(note).toContain('не пройшло');
    expect(note).not.toContain('повернено');
  });
});
