// Фільтр content: доменні помилки → HTTP (404/409/400), 500 логується.
// Публічний 404 не розкриває, що стаття існує, але є чернеткою.

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { ContentError } from '../application/content-errors';

const STATUS_BY_CODE: Record<string, number> = {
  ARTICLE_NOT_FOUND: 404,
  ARTICLE_SLUG_TAKEN: 409,
  INVALID_ARTICLE_INPUT: 400,
};

@Catch()
export class ContentExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }
    if (exception instanceof ContentError) {
      response
        .status(STATUS_BY_CODE[exception.code] ?? 400)
        .json({ code: exception.code, message: exception.message });
      return;
    }
    Logger.error(
      exception instanceof Error ? (exception.stack ?? exception.message) : String(exception),
      'ContentExceptionFilter'
    );
    response.status(500).json({ code: 'CONTENT_INTERNAL', message: 'Internal error' });
  }
}
