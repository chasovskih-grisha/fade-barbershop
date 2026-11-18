// Провайдери AI-провайдера й воркера генерації (T-050). Окремо від use cases
// (haircut-ai-use-case.providers.ts): AI_PROVIDER=fake (дефолт, CI) або gemini.
// Далі AiGenerationCycle на двох фазах (pending → submit, processing → poll).

import type { Provider } from '@nestjs/common';
import { FakeAiGenerationGateway } from './fake-ai-generation.gateway';
import { GeminiAiGenerationGateway } from './gemini-ai-generation.gateway';
import { createGeminiImageClient } from './gemini-image.client';
import { selectAiGenerationGateway } from './ai-generation.gateway.factory';
import { AiGenerationCycle } from './ai-generation.cycle';
import { AiGenerationWorker } from './ai-generation.worker';
import { PrismaSourcePhotoRepository } from './prisma-source-photo.repository';
import { PrismaHaircutSuggestionRepository } from './prisma-haircut-suggestion.repository';
import { PrismaHaircutAiOutbox } from './haircut-ai-outbox';
import { SystemClock } from './system-clock';
import { S3PhotoStorage } from './s3-photo-storage';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';

export const haircutAiWorkerProviders: Provider[] = [
  {
    provide: FakeAiGenerationGateway,
    useFactory: (storage: S3PhotoStorage) => new FakeAiGenerationGateway(storage),
    inject: [S3PhotoStorage],
  },
  {
    provide: GeminiAiGenerationGateway,
    useFactory: (storage: S3PhotoStorage) =>
      new GeminiAiGenerationGateway(
        storage,
        createGeminiImageClient({
          apiKey: process.env.GEMINI_API_KEY ?? '',
          model: process.env.GEMINI_IMAGE_MODEL,
        })
      ),
    inject: [S3PhotoStorage],
  },

  {
    provide: AiGenerationCycle,
    useFactory: (...deps: unknown[]) =>
      new AiGenerationCycle({
        suggestions: deps[0] as never,
        photos: deps[1] as never,
        gateway: selectAiGenerationGateway(process.env, deps[2] as never, deps[6] as never),
        outbox: deps[3] as never,
        uow: deps[4] as never,
        clock: deps[5] as never,
      }),
    inject: [
      PrismaHaircutSuggestionRepository,
      PrismaSourcePhotoRepository,
      FakeAiGenerationGateway,
      PrismaHaircutAiOutbox,
      PrismaUnitOfWork,
      SystemClock,
      GeminiAiGenerationGateway,
    ],
  },
  AiGenerationWorker,
];
