import { Inject, Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import type { SeoBlockRepository } from '../domain/ports';
import { SeoBlock, FaqItem } from '../domain/seo-block';

export interface UpdateSeoBlockDto {
  entityType: string;
  entityId: string;
  title?: string | null;
  metaDescription?: string | null;
  h1?: string | null;
  faq?: FaqItem[];
}

@Injectable()
export class UpdateSeoBlockUseCase {
  constructor(@Inject('SeoBlockRepository') private readonly seoBlockRepo: SeoBlockRepository) {}

  async execute(dto: UpdateSeoBlockDto) {
    const existing = await this.seoBlockRepo.findByEntity(dto.entityType, dto.entityId);
    const id = existing ? existing.id : uuidv7();

    const seoBlock = new SeoBlock({
      id,
      entityType: dto.entityType,
      entityId: dto.entityId,
      title: dto.title ?? null,
      metaDescription: dto.metaDescription ?? null,
      h1: dto.h1 ?? null,
      faq: dto.faq ?? [],
      updatedAt: new Date(),
    });

    await this.seoBlockRepo.save(seoBlock);
    return seoBlock.toDto();
  }
}
