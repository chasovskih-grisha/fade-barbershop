import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { LocationNotFoundError } from '../../locations/application/locations-errors';
import { InvalidScheduleInputError, ScheduleConflictError } from '../domain/availability';

@Catch()
export class AvailabilityExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    if (error instanceof HttpException) {
      response.status(error.getStatus()).json(error.getResponse());
      return;
    }
    const status =
      error instanceof LocationNotFoundError
        ? HttpStatus.NOT_FOUND
        : error instanceof ScheduleConflictError
          ? HttpStatus.CONFLICT
          : error instanceof InvalidScheduleInputError
            ? HttpStatus.BAD_REQUEST
            : HttpStatus.INTERNAL_SERVER_ERROR;
    const code =
      error instanceof LocationNotFoundError
        ? error.code
        : error instanceof ScheduleConflictError
          ? 'SCHEDULE_CONFLICT'
          : error instanceof InvalidScheduleInputError
            ? 'INVALID_SCHEDULE_INPUT'
            : 'INTERNAL';
    const message =
      error instanceof Error && status !== HttpStatus.INTERNAL_SERVER_ERROR
        ? error.message
        : 'Internal server error';
    response.status(status).json({ code, message });
  }
}
