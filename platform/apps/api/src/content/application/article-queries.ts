// Запити статей: адмінський список (усі статуси) і публічна стрічка
// (лише published). Публічний запит принципово не має шляху «показати чернетку» —
// інакше недопублікований текст дістався б до гостя через API.

import type { Article } from '../domain/article';
import type { ArticleRepository } from '../domain/ports';
import { feedQuery, type ArticleFeedQuery } from './article-feed';
import { ArticleNotFoundError } from './content-errors';

export class ListArticlesHandler {
  constructor(private readonly articles: ArticleRepository) {}

  async handle(): Promise<Article[]> {
    return this.articles.list();
  }
}

export class GetArticleHandler {
  constructor(private readonly articles: ArticleRepository) {}

  async handle(id: string): Promise<Article> {
    const article = await this.articles.findById(id);
    if (!article) throw new ArticleNotFoundError();
    return article;
  }
}

export class ListPublishedArticlesHandler {
  constructor(private readonly articles: ArticleRepository) {}

  async handle(raw: ArticleFeedQuery = {}): Promise<Article[]> {
    return this.articles.listPublished(feedQuery(raw));
  }
}

export class GetPublishedArticleHandler {
  constructor(private readonly articles: ArticleRepository) {}

  /** Чернетка за slug — це 404 для публічного API, а не 403: гість не знає,
   * що така стаття існує. */
  async handle(slug: string): Promise<Article> {
    const article = await this.articles.findBySlug(slug);
    if (!article || !article.isPublished) throw new ArticleNotFoundError();
    return article;
  }
}
