import { Catch, HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class SchedulingExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException
        ? (exception.getResponse() as string | object)
        : 'Internal server error';
    response.status(status).json({
      statusCode: status,
      message: typeof message === 'string' ? message : ((message as any).message ?? message),
    });
  }
}
