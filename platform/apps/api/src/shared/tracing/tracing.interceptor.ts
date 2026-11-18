// HTTP-обгортка над доменним tracing: один спан на запит, статус і маршрут
// у атрибутах. Використовується контролерами, що не мають власного декоратора.
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { withSpan } from './tracing';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    return new Observable((subscriber) => {
      withSpan({
        name: `${request.method} ${request.route?.path ?? request.path}`,
        work: () =>
          new Promise<void>((resolve, reject) => {
            next.handle().subscribe({
              next: (value) => subscriber.next(value),
              error: (error) => {
                subscriber.error(error);
                reject(error);
              },
              complete: () => {
                subscriber.complete();
                resolve();
              },
            });
          }),
        options: {
          attributes: {
            'http.method': request.method,
            'http.route': request.route?.path ?? request.path,
            'http.status_code': response.statusCode,
          },
        },
      }).catch(() => undefined);
    });
  }
}
