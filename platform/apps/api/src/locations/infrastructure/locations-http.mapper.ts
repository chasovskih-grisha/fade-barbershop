// Переклад доменних помилок locations на HTTP-статуси.

import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { LocationError } from '../application/locations-errors';
import {
  InvalidLocationInputError,
  LocationCodeTakenError,
  LocationNotFoundError,
} from '../application/locations-errors';

export function toHttp(error: unknown): HttpException {
  if (!(error instanceof LocationError)) return unknownError(error);
  if (error instanceof LocationCodeTakenError) {
    return new HttpException(bodyOf(error), HttpStatus.CONFLICT);
  }
  if (error instanceof LocationNotFoundError) {
    return new HttpException(bodyOf(error), HttpStatus.NOT_FOUND);
  }
  if (error instanceof InvalidLocationInputError) {
    return new HttpException(bodyOf(error), HttpStatus.BAD_REQUEST);
  }
  return new HttpException(bodyOf(error), HttpStatus.BAD_REQUEST);
}

export function bodyOf(error: LocationError): { code: string; message: string } {
  return { code: error.code, message: error.message };
}

function unknownError(error: unknown): HttpException {
  if (error instanceof Error) {
    if (error instanceof HttpException) return error;
    new Logger('LocationsController').error(error.message, error.stack);
    return new HttpException(
      { code: 'INTERNAL', message: 'Internal server error' },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
  throw error;
}
