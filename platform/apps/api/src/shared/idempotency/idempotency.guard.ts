// Guard для мутаційних endpoint-ів (T-4207): вимагає валідний Idempotency-Key
// у заголовку. Саме збереження відповіді виконує IdempotencyInterceptor;
// guard лише не пропускає запит без ключа.
import { CanActivate, ExecutionContext, BadRequestException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { IDEMPOTENCY_HEADER, isValidIdempotencyKey } from './idempotency';

@Injectable()
export class IdempotencyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const raw = request.headers[IDEMPOTENCY_HEADER];
    const key = Array.isArray(raw) ? raw[0] : raw;
    if (!key) {
      throw new BadRequestException(`Missing ${IDEMPOTENCY_HEADER} header`);
    }
    if (!isValidIdempotencyKey(key)) {
      throw new BadRequestException(`${IDEMPOTENCY_HEADER} must be a UUID v4`);
    }
    return true;
  }
}
