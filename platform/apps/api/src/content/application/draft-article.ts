// DraftArticle — створення чернетки статті (MNG-ADM-17). Публікації немає:
// стаття живе в адмінці, поки редактор не натисне «Опублікувати». Унікальність
// slug перевіряється тут, бо це єдина команда, де він береться ззовні.

import { Article, normalizeSlug } from '../domain/article';
import { ArticleDrafted } from '../domain/article.events';
import type { ArticleRepository, Clock, IdGenerator, Outbox, UnitOfWork } from '../domain/ports';
import { ArticleSlugTakenError } from './content-errors';
import { assertDraft, type ArticleDraftInput } from './article-input';

export interface DraftArticleDeps {
  articles: ArticleRepository;
  outbox: Outbox;
  clock: Clock;
  ids: IdGenerator;
  uow: UnitOfWork;
}

export class DraftArticleHandler {
  constructor(private readonly deps: DraftArticleDeps) {}

  async handle(input: ArticleDraftInput): Promise<{ id: string; slug: string }> {
    const { articles, outbox, clock, ids, uow } = this.deps;
    return uow.run(async () => {
      const slug = normalizeSlug(input.slug);
      const values = assertDraft(input, slug);
      if (await articles.findBySlug(slug)) throw new ArticleSlugTakenError();

      const now = clock.now();
      const article = Article.create({ id: ids.id(), ...values, createdAt: now });
      await articles.save(article);
      await outbox.append([
        new ArticleDrafted({
          id: article.id,
          slug: article.slug,
          title: article.title,
          occurredAt: now,
        }),
      ]);
      return { id: article.id, slug: article.slug };
    });
  }
}
