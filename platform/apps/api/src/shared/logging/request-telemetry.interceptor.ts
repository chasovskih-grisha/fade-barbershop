import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'node:crypto';

@Injectable()
export class RequestTelemetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RequestTelemetry');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const { method, url, headers } = request;
    const start = Date.now();

    const incomingHeader = headers && (headers['x-request-id'] || headers['x-correlation-id']);
    const requestId = typeof incomingHeader === 'string' ? incomingHeader : randomUUID();

    if (response && typeof response.setHeader === 'function') {
      response.setHeader('X-Request-Id', requestId);
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - start;
          const statusCode = response.statusCode;
          const isSlow = durationMs > 1000;
          const event = isSlow ? 'http_request_slow' : 'http_request_completed';
          const payload = JSON.stringify({
            event,
            method,
            url,
            statusCode,
            durationMs,
            requestId,
          });

          if (isSlow) {
            this.logger.warn(payload);
          } else {
            this.logger.log(payload);
          }
        },
        error: (err) => {
          const durationMs = Date.now() - start;
          const statusCode = err.status || 500;
          this.logger.error(
            JSON.stringify({
              event: 'http_request_failed',
              method,
              url,
              statusCode,
              durationMs,
              requestId,
              error: err.message,
            })
          );
        },
      })
    );
  }
}
