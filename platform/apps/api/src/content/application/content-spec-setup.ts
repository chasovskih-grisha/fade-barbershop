// Спільний setup для content use-case specs (MNG-ADM-17).

import { DraftArticleHandler } from './draft-article';
import { UpdateArticleHandler } from './update-article';
import { PublishArticleHandler } from './publish-article';
import { UnpublishArticleHandler } from './unpublish-article';
import {
  ListArticlesHandler,
  ListPublishedArticlesHandler,
  GetPublishedArticleHandler,
} from './article-queries';
import {
  FakeArticleRepository,
  FakeClock,
  FakeOutbox,
  SeqIds,
  passthroughUow,
} from './content.fakes';

export const draftInput = {
  title: 'Стрижка по-київськи',
  slug: 'Стрижка по-Київськи',
  body: 'Що таке стрижка по-київськи та кому вона підходить.',
  excerpt: 'Коротко про стиль.',
  tags: ['Стиль', 'стиль', 'поради'],
};

export function contentSetup() {
  const articles = new FakeArticleRepository();
  const outbox = new FakeOutbox();
  const clock = new FakeClock('2026-09-20T09:00:00Z');
  return {
    articles,
    outbox,
    clock,
    drafting: new DraftArticleHandler({
      articles,
      outbox,
      clock,
      ids: new SeqIds(),
      uow: passthroughUow,
    }),
    updating: new UpdateArticleHandler(articles, clock, passthroughUow),
    publishing: new PublishArticleHandler({ articles, outbox, clock, uow: passthroughUow }),
    unpublishing: new UnpublishArticleHandler({ articles, outbox, clock, uow: passthroughUow }),
    adminList: new ListArticlesHandler(articles),
    publicList: new ListPublishedArticlesHandler(articles),
    publicGet: new GetPublishedArticleHandler(articles),
  };
}
