import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorTrackerService } from './error-tracker.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly errorTracker?: ErrorTrackerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : exception instanceof Error
        ? exception.message
        : String(exception);

    const stack =
      exception instanceof Error ? exception.stack : undefined;

    if (status >= 500) {
      this.logger.error(`[HTTP ${status}] ${request?.method ?? 'GET'} ${request?.url ?? ''} - ${message}`, stack);
    }

    if (this.errorTracker) {
      this.errorTracker.recordError(
        `HTTP ${request?.method ?? 'GET'} ${request?.url ?? ''}`,
        message,
        stack,
        status,
      );
    }

    if (response && typeof response.status === 'function') {
      if (exception instanceof HttpException) {
        response.status(status).json(exception.getResponse());
      } else {
        response.status(status).json({
          statusCode: status,
          message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
          timestamp: new Date().toISOString(),
          path: request?.url ?? '',
        });
      }
    }
  }
}
