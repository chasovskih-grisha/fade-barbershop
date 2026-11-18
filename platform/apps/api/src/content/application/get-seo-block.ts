import { Inject, Injectable } from '@nestjs/common';
import type { SeoBlockRepository, ArticleRepository } from '../domain/ports';

@Injectable()
export class GetSeoBlockUseCase {
  constructor(
    @Inject('SeoBlockRepository') private readonly seoBlockRepo: SeoBlockRepository,
    @Inject('ArticleRepository') private readonly articleRepo: ArticleRepository,
  ) {}

  async execute(entityType: string, entityId: string) {
    const existing = await this.seoBlockRepo.findByEntity(entityType, entityId);
    if (existing) {
      return existing.toDto();
    }

    if (entityType === 'article') {
      const article = await this.articleRepo.findById(entityId);
      if (article) {
        return {
          id: null,
          entityType,
          entityId,
          title: article.title,
          metaDescription: article.excerpt || article.title,
          h1: article.title,
          faq: [],
          updatedAt: article.updatedAt.toISOString(),
          isDefault: true,
        };
      }
    }

    return {
      id: null,
      entityType,
      entityId,
      title: null,
      metaDescription: null,
      h1: null,
      faq: [],
      updatedAt: new Date().toISOString(),
      isDefault: true,
    };
  }
}
