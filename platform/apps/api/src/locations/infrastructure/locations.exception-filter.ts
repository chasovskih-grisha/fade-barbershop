// Фільтр для locations: стандартизує body помилок через locations-http.mapper
// (домен → HTTP-статус) і логує 500.

import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Response } from 'express';
import { toHttp } from './locations-http.mapper';

@Catch()
export class LocationsExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const http = exception instanceof HttpException ? exception : toHttp(exception);
    // 500 не мовчать: стек — у stdout контейнера (інакше діагностика сліпа).
    if (!(exception instanceof HttpException)) {
      // eslint-disable-next-line no-console
      console.error(
        '[locations] internal error:',
        exception instanceof Error ? exception.stack : exception
      );
    }
    response.status(http.getStatus()).json(http.getResponse());
  }
}
