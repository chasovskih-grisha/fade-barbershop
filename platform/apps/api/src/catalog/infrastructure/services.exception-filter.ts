import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ServicesError } from '../application/services-errors';

@Catch(ServicesError)
export class ServicesExceptionFilter implements ExceptionFilter {
  catch(exception: ServicesError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const status =
      exception.code === 'SERVICE_NOT_FOUND'
        ? HttpStatus.NOT_FOUND
        : exception.code === 'SERVICE_DUPLICATE'
          ? HttpStatus.CONFLICT
          : HttpStatus.BAD_REQUEST;
    res.status(status).json({ code: exception.code, message: exception.message });
  }
}
