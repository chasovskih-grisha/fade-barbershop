// Специфікація IdempotencyGuard (T-4207): мутація без ключа або з ключем не
// у форматі UUID v4 відхиляється 400, валідний ключ пропускається.
import { BadRequestException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { IdempotencyGuard } from './idempotency.guard';

function contextWith(headers: Record<string, string | undefined>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as unknown as ExecutionContext;
}

describe('IdempotencyGuard', () => {
  const guard = new IdempotencyGuard();

  it('rejects a mutation without an Idempotency-Key header', () => {
    expect(() => guard.canActivate(contextWith({}))).toThrow(BadRequestException);
    expect(() => guard.canActivate(contextWith({}))).toThrow(/Missing idempotency-key/);
  });

  it('rejects a header that is not a UUID v4', () => {
    expect(() => guard.canActivate(contextWith({ 'idempotency-key': 'not-a-uuid' }))).toThrow(
      /must be a UUID v4/
    );
  });

  it('accepts a valid UUID v4 key', () => {
    const valid = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
    expect(guard.canActivate(contextWith({ 'idempotency-key': valid }))).toBe(true);
  });

  it('uses the first value when the header repeats', () => {
    const valid = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ headers: { 'idempotency-key': [valid, 'x'] } }) }),
    } as unknown as ExecutionContext;
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
