import type { ServiceRepository } from '../domain/ports';
import { ServiceNotFoundError } from './services-errors';
import { assertName, assertDuration, assertParallelDuration } from './create-service';

export interface UpdateServiceInput {
  id: string;
  name?: string;
  duration?: number;
  parallelDuration?: number | null;
  description?: string | null;
  category?: string | null;
  slug?: string | null;
  seoDescription?: string | null;
  faq?: any | null;
  sortOrder?: number;
}

export class UpdateServiceHandler {
  constructor(private readonly services: ServiceRepository) {}

  async handle(input: UpdateServiceInput): Promise<{ id: string }> {
    const service = await this.services.findById(input.id);
    if (!service) throw new ServiceNotFoundError();
    service.update(this.changes(input));
    await this.services.save(service);
    return { id: service.id };
  }

  // eslint-disable-next-line complexity
  private changes(input: UpdateServiceInput): {
    name?: string;
    duration?: number;
    parallelDuration?: number | null;
    description?: string | null;
    category?: string | null;
    slug?: string | null;
    seoDescription?: string | null;
    faq?: any | null;
    sortOrder?: number;
  } {
    const changes: {
      name?: string;
      duration?: number;
      parallelDuration?: number | null;
      description?: string | null;
      category?: string | null;
      slug?: string | null;
      seoDescription?: string | null;
      faq?: any | null;
      sortOrder?: number;
    } = {};
    if (input.name !== undefined) changes.name = assertName(input.name);
    if (input.duration !== undefined) changes.duration = assertDuration(input.duration);
    if (input.parallelDuration !== undefined)
      changes.parallelDuration = assertParallelDuration(input.parallelDuration);
    if (input.description !== undefined) changes.description = input.description?.trim() || null;
    if (input.category !== undefined) changes.category = input.category?.trim() || null;
    if (input.slug !== undefined) changes.slug = input.slug?.trim() || null;
    if (input.seoDescription !== undefined) changes.seoDescription = input.seoDescription?.trim() || null;
    if (input.faq !== undefined) changes.faq = input.faq ?? null;
    if (input.sortOrder !== undefined) changes.sortOrder = input.sortOrder;
    return changes;
  }
}
