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

interface FeedParams {
  tag?: string;
  q?: string;
  cursor?: string;
  limit?: string;
}

@Controller('content/articles')
@UseFilters(ContentExceptionFilter)
export class PublicContentController {
  constructor(
    private readonly list: ListPublishedArticlesHandler,
    private readonly get: GetPublishedArticleHandler
  ) {}

  /** GET /content/articles?tag=&q=&cursor=&limit= — стрічка блогу. */
  @Get()
  async listPublished(@Query() params: FeedParams): Promise<ArticleSummaryDto[]> {
    const parsed = Number.parseInt(params.limit ?? '', 10);
    const articles = await this.list.handle({
      tag: params.tag,
      q: params.q,
      cursor: params.cursor,
      limit: Number.isFinite(parsed) ? parsed : undefined,
    });
    return articles.map(toArticleSummary);
  }

  /** GET /content/articles/{slug} — стаття. */
  @Get(':slug')
  async bySlug(@Param('slug') slug: string): Promise<ArticleDto> {
    return toArticleDto(await this.get.handle(slug));
  }
}
