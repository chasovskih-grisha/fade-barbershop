// Публічний API блогу (MNG-ADM-17, products.md §1): стрічка й стаття без
// логіну. Чернетки сюди не потрапляють — це гарантує сам запит, а не фільтр у
// контролері. Помилки — через ContentExceptionFilter (404 для невідомого slug).

import { Controller, Get, Param, Query, UseFilters } from '@nestjs/common';
import {
  ListPublishedArticlesHandler,
  GetPublishedArticleHandler,
} from '../application/article-queries';
import { ContentExceptionFilter } from './content.exception-filter';
import {
  toArticleDto,
  toArticleSummary,
  type ArticleDto,
  type ArticleSummaryDto,
} from './content.dto';

const MAX_LIMIT = 50;

@Controller('content/articles')
@UseFilters(ContentExceptionFilter)
export class PublicContentController {
  constructor(
    private readonly list: ListPublishedArticlesHandler,
    private readonly get: GetPublishedArticleHandler
  ) {}

  /** GET /content/articles?limit=20 — стрічка блогу. */
  @Get()
  async listPublished(@Query('limit') limit?: string): Promise<ArticleSummaryDto[]> {
    const parsed = Number.parseInt(limit ?? '', 10);
    const safe = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, MAX_LIMIT) : 20;
    const articles = await this.list.handle(safe);
    return articles.map(toArticleSummary);
  }

  /** GET /content/articles/{slug} — стаття. */
  @Get(':slug')
  async bySlug(@Param('slug') slug: string): Promise<ArticleDto> {
    return toArticleDto(await this.get.handle(slug));
  }
}
