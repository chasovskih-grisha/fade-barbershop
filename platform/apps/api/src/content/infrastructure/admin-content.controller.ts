// CMS блогу в адмінці (MNG-ADM-17): чернетка, редагування, публікація, зняття.
// Охороняється глобальним AdminSessionGuard (APP_GUARD фільтрує /admin/*).
// Мутації йдуть через use cases, як решта адмін-екранів (admin-screens.md).

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseFilters,
} from '@nestjs/common';
import { ContentExceptionFilter } from './content.exception-filter';
import { toArticleDto, type ArticleDto } from './content.dto';
import { AdminContentHandlers } from './admin-content-handlers';

export interface DraftArticleDto {
  title: string;
  slug: string;
  body: string;
  excerpt?: string;
  coverUrl?: string;
  authorName?: string;
  tags?: string[];
}

export interface UpdateArticleDto {
  title?: string;
  slug?: string;
  body?: string;
  excerpt?: string | null;
  coverUrl?: string | null;
  authorName?: string | null;
  tags?: string[];
}

@Controller('admin/content/articles')
@UseFilters(ContentExceptionFilter)
export class AdminContentController {
  constructor(private readonly handlers: AdminContentHandlers) {}

  @Get()
  async listAll(): Promise<ArticleDto[]> {
    const articles = await this.handlers.useCases.list.handle();
    return articles.map(toArticleDto);
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<ArticleDto> {
    return toArticleDto(await this.handlers.useCases.get.handle(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: DraftArticleDto): Promise<{ id: string; slug: string }> {
    return this.handlers.useCases.draft.handle({
      title: dto.title,
      slug: dto.slug,
      body: dto.body,
      excerpt: dto.excerpt ?? null,
      coverUrl: dto.coverUrl ?? null,
      authorName: dto.authorName ?? null,
      tags: dto.tags ?? [],
    });
  }

  @Patch(':id')
  async patch(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto
  ): Promise<{ id: string; slug: string }> {
    return this.handlers.useCases.update.handle(id, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  async publishArticle(
    @Param('id') id: string
  ): Promise<{ id: string; slug: string; publishedAt: string }> {
    return this.handlers.useCases.publish.handle(id);
  }

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  async unpublishArticle(@Param('id') id: string): Promise<{ id: string; slug: string }> {
    return this.handlers.useCases.unpublish.handle(id);
  }
}
