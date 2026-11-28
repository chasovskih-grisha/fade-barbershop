// Помилки фото відгуку (T-150a): тип — 415, розмір — 413, понад ліміт — 400,
// відсутнє фото — 404; решта йде через мапер вікна (403/404/409).
import {
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  PhotoNotFound,
  PhotoTooLarge,
  TooManyPhotos,
  UnsupportedPhotoType,
} from '../domain/feedback-photo';
import { toFeedbackWindowHttp } from './feedback-window-http.mapper';

export const toFeedbackPhotoHttp = (error: unknown): unknown => {
  if (error instanceof UnsupportedPhotoType)
    return new UnsupportedMediaTypeException(error.message);
  if (error instanceof PhotoTooLarge) return new PayloadTooLargeException(error.message);
  if (error instanceof TooManyPhotos) return new BadRequestException(error.message);
  if (error instanceof PhotoNotFound) return new NotFoundException(error.message);
  return toFeedbackWindowHttp(error);
};
