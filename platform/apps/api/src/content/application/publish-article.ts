// PublishArticle — публікація статті (MNG-ADM-17: «опублікована стаття одразу
// доступна на сайті і в додатку»). Команда мовою домену, а не setStatus:
// повторна публікація лишає дату першої, тому стрічка не «стрибає» вгору.

import { ArticlePublished } from '../domain/article.events';
import type { ArticleRepository, Clock, Outbox, UnitOfWork } from '../domain/ports';
import { ArticleNotFoundError, InvalidArticleInputError } from './content-errors';

export interface PublishArticleDeps {
  articles: ArticleRepository;
  outbox: Outbox;
  clock: Clock;
  uow: UnitOfWork;
}

export class PublishArticleHandler {
  constructor(private readonly deps: PublishArticleDeps) {}

  async handle(id: string): Promise<{ id: string; slug: string; publishedAt: string }> {
    const { articles, outbox, clock, uow } = this.deps;
    return uow.run(async () => {
      const article = await articles.findById(id);
      if (!article) throw new ArticleNotFoundError();

      const now = clock.now();
      let publishedAt: Date;
      try {
        publishedAt = article.publish(now);
      } catch (error) {
        throw new InvalidArticleInputError((error as Error).message);
      }
      await articles.save(article);
      await outbox.append([
        new ArticlePublished({
          id: article.id,
          slug: article.slug,
          publishedAt,
          occurredAt: now,
        }),
      ]);
      return { id: article.id, slug: article.slug, publishedAt: publishedAt.toISOString() };
    });
  }
}
