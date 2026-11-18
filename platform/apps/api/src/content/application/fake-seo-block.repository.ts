import { SeoBlock } from '../domain/seo-block';
import type { SeoBlockRepository } from '../domain/ports';

export class FakeSeoBlockRepository implements SeoBlockRepository {
  private store = new Map<string, SeoBlock>();

  async findByEntity(entityType: string, entityId: string): Promise<SeoBlock | null> {
    return this.store.get(`${entityType}:${entityId}`) ?? null;
  }

  async save(seoBlock: SeoBlock): Promise<void> {
    this.store.set(`${seoBlock.entityType}:${seoBlock.entityId}`, seoBlock);
  }
}
