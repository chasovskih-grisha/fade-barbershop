// T-4207: валідація ключа, відбиток запиту (порядок полів не важливий) і
// рішення replay/conflict/fresh, включно з TTL.
import { IDEMPOTENCY_TTL_MS, decideReplay, expiresAt, fingerprint, isValidIdempotencyKey, type IdempotencySnapshot } from './idempotency';

const KEY = '3f1c2b1a-9d4e-4a77-9b52-0c7f2b3d4e5f';
const NOW = new Date('2026-11-17T12:00:00.000Z');

const stored = (over: Partial<IdempotencySnapshot> = {}): IdempotencySnapshot => ({
  key: KEY,
  fingerprint: fingerprint('POST', '/booking', { b: 1, a: 2 }),
  statusCode: 201,
  body: { id: 'ok' },
  expiresAt: expiresAt(NOW),
  ...over,
});

describe('idempotency rules (T-4207)', () => {
  it('приймає UUID v4 і відхиляє решту', () => {
    expect(isValidIdempotencyKey(KEY)).toBe(true);
    expect(isValidIdempotencyKey(` ${KEY} `)).toBe(true);
    expect(isValidIdempotencyKey('not-a-uuid')).toBe(false);
    expect(isValidIdempotencyKey('3f1c2b1a-9d4e-1a77-9b52-0c7f2b3d4e5f')).toBe(false); // v1
    expect(isValidIdempotencyKey('')).toBe(false);
  });

  it('відбиток не залежить від порядку полів, але залежить від тіла/шляху', () => {
    const left = fingerprint('POST', '/booking', { a: 1, b: 2 });
    expect(left).toBe(fingerprint('post', '/booking', { b: 2, a: 1 }));
    expect(left).not.toBe(fingerprint('POST', '/booking', { a: 1, b: 3 }));
    expect(left).not.toBe(fingerprint('POST', '/booking/1', { a: 1, b: 2 }));
    expect(left).not.toBe(fingerprint('PUT', '/booking', { a: 1, b: 2 }));
  });

  it('немає запису — свіжий запит', () => {
    expect(decideReplay(null, 'x', NOW)).toEqual({ kind: 'fresh' });
  });

  it('той самий ключ і тіло — replay із збереженою відповіддю', () => {
    const record = stored();
    expect(decideReplay(record, record.fingerprint, NOW)).toEqual({
      kind: 'replay',
      statusCode: 201,
      body: { id: 'ok' },
    });
  });

  it('той самий ключ з іншим тілом — конфлікт, а не тихий replay', () => {
    expect(decideReplay(stored(), 'other-fingerprint', NOW)).toEqual({ kind: 'conflict' });
  });

  it('прострочений ключ більше не діє (24 год)', () => {
    const record = stored();
    const afterTtl = new Date(NOW.getTime() + IDEMPOTENCY_TTL_MS + 1);
    expect(decideReplay(record, 'other-fingerprint', afterTtl)).toEqual({ kind: 'fresh' });
  });
});
