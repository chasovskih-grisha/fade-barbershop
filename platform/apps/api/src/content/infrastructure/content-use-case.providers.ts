// Nest-провайдери use cases context content (окремо від @Module — гейт max-lines).

import { PrismaArticleRepository } from './prisma-article.repository';
import { PrismaContentOutbox } from './prisma-content-outbox';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { SystemClock } from '../../locations/infrastructure/system-clock';
import { UuidIdGenerator } from '../../locations/infrastructure/uuid-id-generator';
import { AdminContentHandlers, toAdminContentUseCases, type AdminContentUseCaseList } from './admin-content-handlers';
import { DraftArticleHandler } from '../application/draft-article';
import { UpdateArticleHandler } from '../application/update-article';
import { PublishArticleHandler } from '../application/publish-article';
import { UnpublishArticleHandler } from '../application/unpublish-article';
import { ListArticlesHandler, ListPublishedArticlesHandler, GetArticleHandler, GetPublishedArticleHandler } from '../application/article-queries';

export const contentUseCaseProviders = [
  {
    provide: DraftArticleHandler,
    useFactory: (...deps: any[]) =>
      new DraftArticleHandler({
        articles: deps[0],
        outbox: deps[1],
        clock: deps[2],
        ids: deps[3],
        uow: deps[4],
      }),
    inject: [
      PrismaArticleRepository,
      PrismaContentOutbox,
      SystemClock,
      UuidIdGenerator,
      PrismaUnitOfWork,
    ],
  },
  {
    provide: UpdateArticleHandler,
    useFactory: (...deps: any[]) => new UpdateArticleHandler(deps[0], deps[1], deps[2]),
    inject: [PrismaArticleRepository, SystemClock, PrismaUnitOfWork],
  },
  {
    // prettier-ignore
    provide: PublishArticleHandler,
    // prettier-ignore
    useFactory: (...deps: any[]) => new PublishArticleHandler({ articles: deps[0], outbox: deps[1], clock: deps[2], uow: deps[3] }),
    inject: [PrismaArticleRepository, PrismaContentOutbox, SystemClock, PrismaUnitOfWork],
  },
  {
    // prettier-ignore
    provide: UnpublishArticleHandler,
    // prettier-ignore
    useFactory: (...deps: any[]) => new UnpublishArticleHandler({ articles: deps[0], outbox: deps[1], clock: deps[2], uow: deps[3] }),
    inject: [PrismaArticleRepository, PrismaContentOutbox, SystemClock, PrismaUnitOfWork],
  },
  {
    provide: ListArticlesHandler,
    useFactory: (repo: PrismaArticleRepository) => new ListArticlesHandler(repo),
    inject: [PrismaArticleRepository],
  },
  {
    provide: GetArticleHandler,
    useFactory: (repo: PrismaArticleRepository) => new GetArticleHandler(repo),
    inject: [PrismaArticleRepository],
  },
  {
    provide: ListPublishedArticlesHandler,
    useFactory: (repo: PrismaArticleRepository) => new ListPublishedArticlesHandler(repo),
    inject: [PrismaArticleRepository],
  },
  {
    provide: GetPublishedArticleHandler,
    useFactory: (repo: PrismaArticleRepository) => new GetPublishedArticleHandler(repo),
    inject: [PrismaArticleRepository],
  },
  {
    provide: AdminContentHandlers,
    useFactory: (...useCases: AdminContentUseCaseList) =>
      new AdminContentHandlers(toAdminContentUseCases(...useCases)),
    inject: [
      DraftArticleHandler,
      UpdateArticleHandler,
      PublishArticleHandler,
      UnpublishArticleHandler,
      ListArticlesHandler,
      GetArticleHandler,
    ],
  },
];
