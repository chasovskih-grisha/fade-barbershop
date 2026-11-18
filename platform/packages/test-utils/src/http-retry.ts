// HTTP-хелпери e2e: повтор транзитних збоїв (409 P2034 Serializable, 500
// насичення пулу, обірвані з'єднання) за контрактом клієнта. Три копії циклу
// в scheduling/booking сюїтах — один спільний варіант.
import { HttpStatus } from '@nestjs/common';
import type * as request from 'supertest';

interface RetryOptions {
  attempts?: number;
  expectStatus?: number;
}

const TRANSIENT_WRITE = (status: number | undefined): boolean =>
  status === undefined ||
  status === HttpStatus.CONFLICT ||
  status === HttpStatus.INTERNAL_SERVER_ERROR;

/** GET не може дати 409-конфлікту — транзитний лише 500 (насичення пулу). */
const TRANSIENT_READ = (status: number | undefined): boolean =>
  status === undefined || status === HttpStatus.INTERNAL_SERVER_ERROR;

/** Спільний цикл: транзитні статуси/кинуті помилки → повтор; інакше — вихід.
 * Вичерпано спроби → кинути останню помилку або mismatch зі статусом. */
async function sendWithRetry(
  call: () => Promise<request.Response>,
  opts: RetryOptions,
  isTransient: (status: number | undefined) => boolean
): Promise<request.Response> {
  const attempts = opts.attempts ?? 6;
  const expectStatus = opts.expectStatus ?? HttpStatus.CREATED;
  let response: request.Response | undefined;
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      response = await call();
    } catch (error) {
      lastError = error;
      continue;
    }
    if (!isTransient(response.status)) break;
  }
  if (response === undefined) {
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
  if (response.status !== expectStatus) {
    throw new Error(`retry: expected ${expectStatus}, got ${response.status}`);
  }
  return response;
}

/** POST із повтором транзитних збоїв; очікує expectStatus (дефолт 201). */
export function postWithRetry(
  post: (body: object) => Promise<request.Response>,
  body: object,
  opts: RetryOptions = {}
): Promise<request.Response> {
  return sendWithRetry(
    () => post(body),
    { expectStatus: HttpStatus.CREATED, ...opts },
    TRANSIENT_WRITE
  );
}

/** PATCH із повтором транзитних збоїв; очікує expectStatus (дефолт 200). */
export function patchWithRetry(
  patch: (body: object) => Promise<request.Response>,
  body: object,
  opts: RetryOptions = {}
): Promise<request.Response> {
  return sendWithRetry(
    () => patch(body),
    { expectStatus: HttpStatus.OK, ...opts },
    TRANSIENT_WRITE
  );
}

/** GET із повтором транзитних 500; очікує expectStatus (дефолт 200). */
export function getWithRetry(
  get: (url: string) => Promise<request.Response>,
  url: string,
  opts: RetryOptions = {}
): Promise<request.Response> {
  return sendWithRetry(() => get(url), { expectStatus: HttpStatus.OK, ...opts }, TRANSIENT_READ);
}
