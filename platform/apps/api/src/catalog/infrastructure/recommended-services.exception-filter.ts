// HTTP-коди блоку «рекомендуємо» (T-4445): поганий конфіг/подія — 400,
// послуга, якої тут не продають — 404.
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import {
  InvalidRecommendationEvent,
  InvalidRecommendedConfig,
  UnknownRecommendedService,
  UnknownServiceInConfig,
} from '../domain/recommended-services';

type RecommendationError =
  | InvalidRecommendedConfig
  | InvalidRecommendationEvent
  | UnknownRecommendedService
  | UnknownServiceInConfig;

@Catch(
  InvalidRecommendedConfig,
  InvalidRecommendationEvent,
  UnknownRecommendedService,
  UnknownServiceInConfig
)
export class RecommendedServicesExceptionFilter implements ExceptionFilter {
  catch(exception: RecommendationError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const notFound =
      exception instanceof UnknownRecommendedService || exception instanceof UnknownServiceInConfig;
    res.status(notFound ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST).json({
      code: exception.name,
      message: exception.message,
    });
  }
}
