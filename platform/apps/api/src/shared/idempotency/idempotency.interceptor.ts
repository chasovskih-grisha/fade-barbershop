// Interceptor idempotency-ключів (T-4207): на mutating-запитах із
// `Idempotency-Key` повтор віддає збережену відповідь, а не створює дубль.
// Без заголовка запит проходить як звичайний — ключ опційний, валідується,
// коли присутній (ADR 0009: ретраї не повинні дублювати записи й платежі).
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { concatMap, of, type Observable } from 'rxjs';
import type { Request, Response } from 'express';
import { IDEMPOTENCY_STORE, type IdempotencyStore } from './idempotency.store';
import {
  IDEMPOTENCY_HEADER,
  MUTATING_METHODS,
  REPLAYED_HEADER,
  decideReplay,
  expiresAt,
  fingerprint,
  isValidIdempotencyKey,
} from './idempotency';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(@Inject(IDEMPOTENCY_STORE) private readonly store: IdempotencyStore) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const key = this.keyOf(request);
    if (!key || !MUTATING_METHODS.has((request.method ?? '').toUpperCase())) return next.handle();
    if (!isValidIdempotencyKey(key)) {
      throw new BadRequestException('Idempotency-Key must be a UUID v4');
    }
    const now = new Date();
    const requestFingerprint = fingerprint(
      request.method,
      request.originalUrl ?? request.url,
      request.body
    );
    const decision = decideReplay(await this.store.find(key), requestFingerprint, now);
    if (decision.kind === 'conflict') {
      throw new ConflictException('Idempotency-Key was reused with a different request');
    }
    if (decision.kind === 'replay') {
      return this.replay(http.getResponse<Response>(), decision);
    }
    const response = http.getResponse<Response>();
    return next
      .handle()
      .pipe(
        concatMap((body) =>
          this.remember({ key, requestFingerprint, body, response, now }).then(() => body)
        )
      );
  }

  private keyOf(request: Request): string | undefined {
    const raw = request.headers[IDEMPOTENCY_HEADER];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value && value.trim() ? value.trim() : undefined;
  }

  private replay(
    response: Response,
    decision: { statusCode: number; body: unknown }
  ): Observable<unknown> {
    response.setHeader(REPLAYED_HEADER, 'true');
    response.status(decision.statusCode);
    return of(decision.body);
  }

  private async remember(input: {
    key: string;
    requestFingerprint: string;
    body: unknown;
    response: Response;
    now: Date;
  }): Promise<void> {
    try {
      await this.store.purgeExpired(input.now);
      await this.store.save({
        key: input.key,
        fingerprint: input.requestFingerprint,
        statusCode: input.response.statusCode || 200,
        body: input.body,
        expiresAt: expiresAt(input.now),
      });
    } catch {
      // Сховище ключів не має ламати успішну відповідь клієнту.
    }
  }
}
