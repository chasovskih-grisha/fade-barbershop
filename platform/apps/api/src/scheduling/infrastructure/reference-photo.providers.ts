// Провайдери фото-референсів для сітки календаря (REF-ADM-01) окремим файлом:
// SchedulingModule тримає список провайдерів під гейтом max-lines.
import { PrismaSourcePhotoRepository } from '../../haircut-ai/infrastructure/prisma-source-photo.repository';
import { S3PhotoStorage } from '../../haircut-ai/infrastructure/s3-photo-storage';
import { HaircutAiReferencePhotoUrls } from './reference-photo-urls.adapter';

export const referencePhotoProviders = [
  PrismaSourcePhotoRepository,
  S3PhotoStorage,
  HaircutAiReferencePhotoUrls,
];
