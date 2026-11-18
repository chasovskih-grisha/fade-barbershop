// Фільтр для identity: додає Retry-After з тіла помилки (429) і стандартизує body.
// Nest 10 HttpExceptionOptions не має headers — header ставиться тут, у межі HTTP.

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class IdentityExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('IdentityExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const retryAfter = retryAfterOf(body);
      if (retryAfter !== undefined) response.setHeader('Retry-After', String(retryAfter));
      response.status(exception.getStatus()).json(body);
      return;
    }
    if (exception instanceof Error) this.logger.error(`${exception.message}\n${exception.stack ?? ''}`);
    else this.logger.error(JSON.stringify(exception));
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ code: 'INTERNAL', message: 'Internal server error' });
  }
}

function retryAfterOf(body: string | object): number | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const value = (body as { retryAfterSec?: number }).retryAfterSec;
  return typeof value === 'number' ? value : undefined;
}
