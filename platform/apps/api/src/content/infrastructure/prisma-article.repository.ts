// Prisma-адаптер ArticleRepository (content, MNG-ADM-17). Агрегат — один рядок
// Article; теги — масив рядків у колонці, нормалізація — в домені.

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { Article } from '../domain/article';
import type { ArticleRepository } from '../domain/ports';
import { currentDb } from '../../shared/prisma/prisma-context';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { hydrateArticle } from './prisma-article-row';
import { feedQuery, type ArticleFeedQuery } from '../application/article-feed';
import { feedWhere } from './article-feed.where';

@Injectable()
export class PrismaArticleRepository implements ArticleRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  findById(id: string): Promise<Article | null> {
    return this.db()
      .article.findUnique({ where: { id } })
      .then((row) => (row ? hydrateArticle(row) : null));
  }

  findBySlug(slug: string): Promise<Article | null> {
    return this.db()
      .article.findUnique({ where: { slug } })
      .then((row) => (row ? hydrateArticle(row) : null));
  }

  async save(article: Article): Promise<void> {
    const {
      id,
      slug,
      title,
      excerpt,
      body,
      coverUrl,
      authorName,
      status,
      publishedAt,
      createdAt,
      updatedAt,
      tags,
    } = article.snapshot;
    await this.db().article.upsert({
      where: { id },
      create: {
        id,
        slug,
        title,
        excerpt,
        body,
        coverUrl,
        authorName,
        status,
        publishedAt,
        tags,
        createdAt,
        updatedAt,
      },
      update: {
        slug,
        title,
        excerpt,
        body,
        coverUrl,
        authorName,
        status,
        publishedAt,
        tags,
        updatedAt,
      },
    });
  }

  async list(): Promise<Article[]> {
    const rows = await this.db().article.findMany({ orderBy: [{ createdAt: 'desc' }] });
    return rows.map(hydrateArticle);
  }

  /** Публічна стрічка: лише published, новіші спершу, з пошуком, тегом і курсором. */
  async listPublished(raw: ArticleFeedQuery = {}): Promise<Article[]> {
    const limit = feedQuery(raw).limit;
    const rows = await this.db().article.findMany({
      where: feedWhere(raw),
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      ...(limit !== undefined ? { take: limit } : {}),
    });
    return rows.map(hydrateArticle);
  }
}
