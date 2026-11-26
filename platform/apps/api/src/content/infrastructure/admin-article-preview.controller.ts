// Прев'ю статті в адмінці (T-2300d): сервер розбирає тіло тим самим парсером,
// що й публікація, і нічого не пише. Шлях під /admin/* тримає AdminSessionGuard.

import { Body, Controller, HttpCode, HttpStatus, Post, UseFilters } from '@nestjs/common';
import { ContentExceptionFilter } from './content.exception-filter';
import { PreviewArticleHandler } from '../application/preview-article';
import type { ArticleBlock } from '../domain/article-body';

export interface PreviewArticleDto {
  body: string;
}

@Controller('admin/content/articles')
@UseFilters(ContentExceptionFilter)
export class AdminArticlePreviewController {
  constructor(private readonly preview: PreviewArticleHandler) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  previewArticle(@Body() dto: PreviewArticleDto): { blocks: ArticleBlock[] } {
    return this.preview.handle({ body: dto.body });
  }
}
