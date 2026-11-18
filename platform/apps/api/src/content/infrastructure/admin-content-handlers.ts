// Бандл use cases адмін-CMS: контролер отримує один об'єкт замість шести
// аргументів (гейт max-params ≤ 3). Збірка в content.module.ts.

import { DraftArticleHandler } from '../application/draft-article';
import { UpdateArticleHandler } from '../application/update-article';
import { PublishArticleHandler } from '../application/publish-article';
import { UnpublishArticleHandler } from '../application/unpublish-article';
import { ListArticlesHandler, GetArticleHandler } from '../application/article-queries';

export interface AdminContentUseCases {
  draft: DraftArticleHandler;
  update: UpdateArticleHandler;
  publish: PublishArticleHandler;
  unpublish: UnpublishArticleHandler;
  list: ListArticlesHandler;
  get: GetArticleHandler;
}

export type AdminContentUseCaseList = [
  DraftArticleHandler,
  UpdateArticleHandler,
  PublishArticleHandler,
  UnpublishArticleHandler,
  ListArticlesHandler,
  GetArticleHandler,
];

export function toAdminContentUseCases(...handlers: AdminContentUseCaseList): AdminContentUseCases {
  const [draft, update, publish, unpublish, list, get] = handlers;
  return { draft, update, publish, unpublish, list, get };
}

/** Значення-бандл для DI контролера AdminContentController. */
export class AdminContentHandlers {
  constructor(readonly useCases: AdminContentUseCases) {}
}
