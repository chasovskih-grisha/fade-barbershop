// Спільний bootstrap e2e content: фейки портів + Nest ContentModule.

import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ContentModule } from '../infrastructure/content.module';
import { PrismaArticleRepository } from '../infrastructure/prisma-article.repository';
import { PrismaSeoBlockRepository } from '../infrastructure/prisma-seo-block.repository';
import { FakeSeoBlockRepository } from '../application/fake-seo-block.repository';
import { PrismaContentOutbox } from '../infrastructure/prisma-content-outbox';
import { SystemClock } from '../../locations/infrastructure/system-clock';
import { UuidIdGenerator } from '../../locations/infrastructure/uuid-id-generator';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import {
  FakeArticleRepository,
  FakeClock,
  FakeOutbox,
  SeqIds,
  passthroughUow,
} from '../application/content.fakes';

export async function createContentE2eApp(): Promise<{
  app: INestApplication;
  articles: FakeArticleRepository;
  outbox: FakeOutbox;
}> {
  const articles = new FakeArticleRepository();
  const outbox = new FakeOutbox();
  const seoBlocks = new FakeSeoBlockRepository();
  const moduleRef: TestingModule = await Test.createTestingModule({ imports: [ContentModule] })
    .overrideProvider(PrismaArticleRepository)
    .useValue(articles)
    .overrideProvider(PrismaSeoBlockRepository)
    .useValue(seoBlocks)
    .overrideProvider(PrismaContentOutbox)
    .useValue(outbox)
    .overrideProvider(PrismaUnitOfWork)
    .useValue(passthroughUow)
    .overrideProvider(SystemClock)
    .useValue(new FakeClock('2026-09-20T09:00:00Z'))
    .overrideProvider(UuidIdGenerator)
    .useValue(new SeqIds())
    .compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return { app, articles, outbox };
}

export const e2eDraft = {
  title: 'Стрижка по-київськи',
  slug: 'strizhka-po-kyivsku',
  body: 'Що це за стиль.',
  tags: ['стиль'],
};
