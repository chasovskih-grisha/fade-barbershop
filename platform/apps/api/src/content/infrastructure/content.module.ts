// ContentModule — збірка context content (MNG-ADM-17): use cases зв'язуються з
// Prisma, годинником, ID і outbox. Транзакція = один use case.

import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { SystemClock } from '../../locations/infrastructure/system-clock';
import { UuidIdGenerator } from '../../locations/infrastructure/uuid-id-generator';
import { PrismaArticleRepository } from './prisma-article.repository';
import { PrismaSeoBlockRepository } from './prisma-seo-block.repository';
import { PrismaContentOutbox } from './prisma-content-outbox';
import { PublicContentController } from './public-content.controller';
import { AdminContentController } from './admin-content.controller';
import { SeoBlockController } from './seo-block.controller';
import { GetSeoBlockUseCase } from '../application/get-seo-block';
import { UpdateSeoBlockUseCase } from '../application/update-seo-block';
import { contentUseCaseProviders } from './content-use-case.providers';

@Module({
  controllers: [PublicContentController, AdminContentController, SeoBlockController],
  providers: [
    PrismaService,
    { provide: PrismaClient, useExisting: PrismaService },
    PrismaUnitOfWork,
    PrismaArticleRepository,
    { provide: 'ArticleRepository', useExisting: PrismaArticleRepository },
    PrismaSeoBlockRepository,
    { provide: 'SeoBlockRepository', useExisting: PrismaSeoBlockRepository },
    PrismaContentOutbox,
    SystemClock,
    UuidIdGenerator,
    GetSeoBlockUseCase,
    UpdateSeoBlockUseCase,
    ...contentUseCaseProviders,
  ],
  exports: [PrismaArticleRepository, PrismaSeoBlockRepository],
})
export class ContentModule {}
