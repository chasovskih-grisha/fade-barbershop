// Exception filter для haircut-ai (Supporting, ADR 0008).
// Мапить доменні винятки на HTTP статус-коди.

import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { SourcePhotoNotFoundError, SuggestionNotFoundError, ConsentRequiredError, GenerationLimitExceededError, InvalidGenerationStatusError, PhotoAlreadyDeletedError, VariantNotFoundError } from '../application/haircut-errors';

@Catch()
export class HaircutExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof SourcePhotoNotFoundError) {
      return response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        message: exception.message,
      });
    }

    if (exception instanceof SuggestionNotFoundError) {
      return response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        message: exception.message,
      });
    }

    if (exception instanceof VariantNotFoundError) {
      return response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        message: exception.message,
      });
    }

    if (exception instanceof ConsentRequiredError) {
      return response.status(HttpStatus.FORBIDDEN).json({
        statusCode: HttpStatus.FORBIDDEN,
        error: 'Forbidden',
        message: exception.message,
      });
    }

    if (exception instanceof GenerationLimitExceededError) {
      return response.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message: exception.message,
      });
    }

    if (exception instanceof InvalidGenerationStatusError) {
      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: exception.message,
      });
    }

    if (exception instanceof PhotoAlreadyDeletedError) {
      return response.status(HttpStatus.GONE).json({
        statusCode: HttpStatus.GONE,
        error: 'Gone',
        message: exception.message,
      });
    }

    if (exception instanceof HttpException) {
      return response.status(exception.getStatus()).json(exception.getResponse());
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Unexpected error',
    });
  }
}
