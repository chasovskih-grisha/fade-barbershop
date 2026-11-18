// T-4207: інтерсептор віддає кешовану відповідь на повтор, конфліктує на
// інше тіло з тим самим ключем і не чіпає запити без ключа.
import { BadRequestException, ConflictException } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import type { ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import type { IdempotencyStore } from './idempotency.store';
import { expiresAt, fingerprint, type IdempotencySnapshot } from './idempotency';

const KEY = '3f1c2b1a-9d4e-4a77-9b52-0c7f2b3d4e5f';
function contextOf(method: string, headers: Record<string, string> = {}, body?: unknown) {
  const request = { method, headers, body, originalUrl: '/booking' } as unknown as Request;
  const response = {
    statusCode: 201,
    setHeader: jest.fn(),
    status: jest.fn(),
  };
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response as unknown as Response,
    }),
  } as unknown as ExecutionContext;
  return { context, response };
}

function storeOf(record: IdempotencySnapshot | null): IdempotencyStore & {
  save: jest.Mock;
  purgeExpired: jest.Mock;
} {
  return {
    find: jest.fn(async () => record),
    save: jest.fn(async () => undefined),
    purgeExpired: jest.fn(async () => 0),
  };
}

const nextWith = (value: unknown) => ({ handle: () => of(value) });

describe('IdempotencyInterceptor (T-4207)', () => {
  it('без ключа пропускає запит без звернень до сховища', async () => {
    const store = storeOf(null);
    const interceptor = new IdempotencyInterceptor(store);
    const { context } = contextOf('POST', {}, { a: 1 });
    await expect(firstValueFrom(await interceptor.intercept(context, nextWith({ id: 1 })))).resolves.toEqual({
      id: 1,
    });
    expect(store.find).not.toHaveBeenCalled();

    // лише читання: навіть із ключем GET не кешується
    const read = contextOf('GET', { 'idempotency-key': KEY });
    await interceptor.intercept(read.context, nextWith({ ok: true }));
    expect(store.save).not.toHaveBeenCalled();
  });

  it('невалідний ключ — 400', async () => {
    const interceptor = new IdempotencyInterceptor(storeOf(null));
    const { context } = contextOf('POST', { 'idempotency-key': 'nope' });
    await expect(interceptor.intercept(context, nextWith({}))).rejects.toBeInstanceOf(BadRequestException);
  });
  it('перший запит зберігає відповідь із статусом', async () => {
    const store = storeOf(null);
    const interceptor = new IdempotencyInterceptor(store);
    const { context } = contextOf('POST', { 'idempotency-key': KEY }, { a: 1 });
    await expect(firstValueFrom(await interceptor.intercept(context, nextWith({ id: 7 })))).resolves.toEqual({
      id: 7,
    });
    expect(store.purgeExpired).toHaveBeenCalled();
    expect(store.save).toHaveBeenCalledWith(
      expect.objectContaining({ key: KEY, statusCode: 201, body: { id: 7 } })
    );
  });

  it('повтор віддає збережене тіло, статус і позначає replay', async () => {
    const now = new Date();
    const record: IdempotencySnapshot = {
      key: KEY,
      fingerprint: fingerprint('POST', '/booking', { a: 1 }),
      statusCode: 201,
      body: { id: 7 },
      expiresAt: expiresAt(now),
    };
    const store = storeOf(record);
    const interceptor = new IdempotencyInterceptor(store);
    const { context, response } = contextOf('POST', { 'idempotency-key': KEY }, { a: 1 });
    const result = await interceptor.intercept(context, nextWith({ id: 8 }));
    await expect(firstValueFrom(result)).resolves.toEqual({ id: 7 });
    expect(response.setHeader).toHaveBeenCalledWith('idempotency-replayed', 'true');
    expect(response.status).toHaveBeenCalledWith(201);
    expect(store.save).not.toHaveBeenCalled();
  });

  it('той самий ключ з іншим тілом — 409', async () => {
    const record: IdempotencySnapshot = {
      key: KEY,
      fingerprint: fingerprint('POST', '/booking', { a: 1 }),
      statusCode: 201,
      body: { id: 7 },
      expiresAt: expiresAt(new Date()),
    };
    const interceptor = new IdempotencyInterceptor(storeOf(record));
    const { context } = contextOf('POST', { 'idempotency-key': KEY }, { a: 2 });
    await expect(interceptor.intercept(context, nextWith({ id: 9 }))).rejects.toBeInstanceOf(
      ConflictException
    );
  });
});
