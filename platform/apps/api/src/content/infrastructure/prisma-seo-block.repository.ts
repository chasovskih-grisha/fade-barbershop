import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SeoBlock, FaqItem } from '../domain/seo-block';
import type { SeoBlockRepository } from '../domain/ports';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class PrismaSeoBlockRepository implements SeoBlockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEntity(entityType: string, entityId: string): Promise<SeoBlock | null> {
    const record = await this.prisma.seoBlockRecord.findUnique({
      where: { entityType_entityId: { entityType, entityId } },
    });
    if (!record) return null;
    return new SeoBlock({
      id: record.id,
      entityType: record.entityType,
      entityId: record.entityId,
      title: record.title,
      metaDescription: record.metaDescription,
      h1: record.h1,
      faq: (record.faq as unknown as FaqItem[]) || [],
      updatedAt: record.updatedAt,
    });
  }

  async save(seoBlock: SeoBlock): Promise<void> {
    await this.prisma.seoBlockRecord.upsert({
      where: { entityType_entityId: { entityType: seoBlock.entityType, entityId: seoBlock.entityId } },
      create: {
        id: seoBlock.id,
        entityType: seoBlock.entityType,
        entityId: seoBlock.entityId,
        title: seoBlock.title,
        metaDescription: seoBlock.metaDescription,
        h1: seoBlock.h1,
        faq: seoBlock.faq as unknown as Prisma.InputJsonValue,
        updatedAt: seoBlock.updatedAt,
      },
      update: {
        title: seoBlock.title,
        metaDescription: seoBlock.metaDescription,
        h1: seoBlock.h1,
        faq: seoBlock.faq as unknown as Prisma.InputJsonValue,
        updatedAt: seoBlock.updatedAt,
      },
    });
  }
}
