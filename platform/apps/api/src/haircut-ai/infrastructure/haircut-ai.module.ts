// Контекст haircut-ai (Supporting, ADR 0008). Матеріальне в v1 — прийом
// референсного фото у флоу запису (T-043); з фази 10 — AI-генерація
// (T-050/051/052): черга AiGenerationWorker, порт AiGenerationGateway з фейк-
// адаптером, статуси й історія в кабінті.
//
// Транзакція = один use case (PrismaUnitOfWork). Провайдер — тільки з воркера,
// з HTTP-запиту він не кликається ніколи.

import { Module } from '@nestjs/common';
import { HaircutAiController } from './haircut-ai.controller';
import { HaircutAiGenerationController } from './haircut-ai-generation.controller';
import { haircutAiUseCaseProviders } from './haircut-ai-use-case.providers';
import { haircutAiWorkerProviders } from './haircut-ai-worker.providers';
import { S3PhotoStorage } from './s3-photo-storage';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Module({
  controllers: [HaircutAiController, HaircutAiGenerationController],
  providers: [PrismaService, ...haircutAiUseCaseProviders, ...haircutAiWorkerProviders],
  // S3PhotoStorage експортуємо: барбера в адмінці (T-0xx) переглядає фото клієнтів.
  exports: [S3PhotoStorage],
})
export class HaircutAiModule {}
