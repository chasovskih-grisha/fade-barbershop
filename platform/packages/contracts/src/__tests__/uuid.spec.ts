import { randomUUID } from 'node:crypto';
import { isUuid, isUuidV7, UUID_PATTERN, UUID_V7_PATTERN, uuidSchema, uuidV7Schema } from '../uuid';

/** v7 як його генерує домен: 48 біт часу + версія 7 + variant 10. */
const V7 = '0192f1a4-7c3b-7a8e-9b41-2f6d5c8e0a13';
const V4 = '3f9a1c2e-4b6d-4e8f-a1b2-c3d4e5f60718';
/** v5 від `seedUuid('loc_KYY_01')` — детермінований сід для e2e (T-4300b). */
const V5 = 'bde08f5a-d34d-59c8-b9c3-11237327c085';

describe('UUID контракт (T-4300d)', () => {
  it('приймає v7 — формат, який генерує домен', () => {
    expect(isUuid(V7)).toBe(true);
    expect(isUuidV7(V7)).toBe(true);
    expect(uuidSchema.parse(V7)).toBe(V7);
    expect(uuidV7Schema.parse(V7)).toBe(V7);
  });

  it('приймає v4 і v5 із dev-фікстур та сідів, але не вважає їх v7', () => {
    for (const value of [V4, V5, randomUUID()]) {
      expect(isUuid(value)).toBe(true);
      expect(uuidSchema.parse(value)).toBe(value);
      expect(isUuidV7(value)).toBe(false);
      expect(uuidV7Schema.safeParse(value).success).toBe(false);
    }
  });

  it('відкидає довільні рядки, короткі id і числа', () => {
    for (const value of ['loc-1', '42', 42, '', 'not-a-uuid']) {
      expect(isUuid(value)).toBe(false);
      expect(uuidSchema.safeParse(value).success).toBe(false);
    }
  });

  it('приймає верхній регістр і не приймає зіпсований variant/version', () => {
    expect(isUuid(V7.toUpperCase())).toBe(true);
    // version 0 і variant 00 — не RFC 9562.
    expect(isUuid('0192f1a4-7c3b-0a8e-0b41-2f6d5c8e0a13')).toBe(false);
    // v9 не існує.
    expect(isUuid('0192f1a4-7c3b-9a8e-9b41-2f6d5c8e0a13')).toBe(false);
  });

  it('експортує regex, яким користуються клієнти без zod', () => {
    expect(UUID_PATTERN.test(V7)).toBe(true);
    expect(UUID_V7_PATTERN.test(V4)).toBe(false);
  });
});
