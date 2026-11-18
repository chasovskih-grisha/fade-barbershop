// Специ хелперів retry: транзитний повтор 409/500/кинутих помилок,
// нетранзитні статуси — без повтору, вичерпання спроб — останній статус.
import { HttpStatus } from '@nestjs/common';
import type request from 'supertest';
import { postWithRetry, patchWithRetry, getWithRetry } from './http-retry';

const CONFLICT = HttpStatus.CONFLICT;
const SERVER_ERROR = HttpStatus.INTERNAL_SERVER_ERROR;
const CREATED = HttpStatus.CREATED;

describe('postWithRetry', () => {
  it('повторює транзитні 409/500 до успіху', async () => {
    let calls = 0;
    const post = jest.fn(async () => {
      calls += 1;
      // prettier-ignore
      const status = calls === 1 ? SERVER_ERROR : calls === 2 ? CONFLICT : CREATED;
      return { status } as unknown as request.Response;
    });
    const res = await postWithRetry(post, {});
    expect(res.status).toBe(CREATED);
    expect(post).toHaveBeenCalledTimes(3);
  });

  it('не повторює 400 — це валідна відповідь, не транзитний збій', async () => {
    // prettier-ignore
    const post = jest.fn(async () => ({ status: HttpStatus.BAD_REQUEST }) as unknown as request.Response);
    await expect(postWithRetry(post, {})).rejects.toThrow(/expected 201, got 400/);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('вичерпує спроби і кидає з останнім статусом', async () => {
    const post = jest.fn(async () => ({ status: CONFLICT }) as unknown as request.Response);
    await expect(postWithRetry(post, {}, { attempts: 3 })).rejects.toThrow(/got 409/);
    expect(post).toHaveBeenCalledTimes(3);
  });

  it("повторює кинуті помилки (обірване з'єднання) і встигає до успіху", async () => {
    let calls = 0;
    const post = jest.fn(async () => {
      calls += 1;
      if (calls === 1) throw new Error('socket hang up');
      return { status: CREATED } as unknown as request.Response;
    });
    const res = await postWithRetry(post, {});
    expect(res.status).toBe(CREATED);
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('усі спроби кинули помилку → кидає останню', async () => {
    const post = jest.fn(async () => {
      throw new Error('ECONNRESET');
    });
    await expect(postWithRetry(post, {}, { attempts: 2 })).rejects.toThrow('ECONNRESET');
    expect(post).toHaveBeenCalledTimes(2);
  });
});

describe('getWithRetry', () => {
  it('ретраїть лише 500 (GET не дає 409), очікує 200', async () => {
    let calls = 0;
    const get = jest.fn(async () => {
      calls += 1;
      const status = calls === 1 ? HttpStatus.INTERNAL_SERVER_ERROR : HttpStatus.OK;
      return { status } as unknown as request.Response;
    });
    const res = await getWithRetry(get, '/x');
    expect(res.status).toBe(HttpStatus.OK);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('не ретраїть 404 — валідна відповідь', async () => {
    const get = jest.fn(
      async () => ({ status: HttpStatus.NOT_FOUND }) as unknown as request.Response
    );
    await expect(getWithRetry(get, '/x')).rejects.toThrow(/expected 200, got 404/);
    expect(get).toHaveBeenCalledTimes(1);
  });
});

describe('patchWithRetry', () => {
  it('повторює транзитні 409/500 до 200 OK', async () => {
    let calls = 0;
    const patch = jest.fn(async () => {
      calls += 1;
      const status = calls === 1 ? CONFLICT : HttpStatus.OK;
      return { status } as unknown as request.Response;
    });
    const res = await patchWithRetry(patch, {});
    expect(res.status).toBe(HttpStatus.OK);
    expect(patch).toHaveBeenCalledTimes(2);
  });

  it('вичерпує спроби → останній статус у помилці', async () => {
    const patch = jest.fn(async () => ({ status: SERVER_ERROR }) as unknown as request.Response);
    await expect(patchWithRetry(patch, {}, { attempts: 2 })).rejects.toThrow(/got 500/);
    expect(patch).toHaveBeenCalledTimes(2);
  });
});
