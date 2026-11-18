// UnpublishArticle — зняття статті з публікації (MNG-ADM-17). Текст не
// видаляється: стаття лишається чернеткою в адмінці, але зникає із сайту й
// додатка (публічні запити дивляться лише published).

import { ArticleUnpublished } from '../domain/article.events';
import type { ArticleRepository, Clock, Outbox, UnitOfWork } from '../domain/ports';
import { ArticleNotFoundError } from './content-errors';

export interface UnpublishArticleDeps {
  articles: ArticleRepository;
  outbox: Outbox;
  clock: Clock;
  uow: UnitOfWork;
}

export class UnpublishArticleHandler {
  constructor(private readonly deps: UnpublishArticleDeps) {}

  async handle(id: string): Promise<{ id: string; slug: string }> {
    const { articles, outbox, clock, uow } = this.deps;
    return uow.run(async () => {
      const article = await articles.findById(id);
      if (!article) throw new ArticleNotFoundError();

      const now = clock.now();
      article.unpublish(now);
      await articles.save(article);
      await outbox.append([
        new ArticleUnpublished({ id: article.id, slug: article.slug, occurredAt: now }),
      ]);
      return { id: article.id, slug: article.slug };
    });
  }
}
