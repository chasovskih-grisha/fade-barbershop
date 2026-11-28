import { uuidv7 } from '@fade/domain-shared';
import {
  InvalidDurationVariantError,
  assertDurationVariant,
  type DurationVariant,
} from '../domain/duration-variant';
import { Service } from '../domain/service';
import type { ServiceRepository } from '../domain/ports';
import { InvalidServiceInputError, ServiceCodeTakenError } from './services-errors';

export interface CreateServiceInput {
  name: string;
  duration: number;
  parallelDuration?: number | null;
  description?: string | null;
  category?: string | null;
  slug?: string | null;
  seoDescription?: string | null;
  faq?: any | null;
  variants?: DurationVariant[] | null;
  sortOrder?: number;
}

export class CreateServiceHandler {
  constructor(private readonly services: ServiceRepository) {}

  async handle(input: CreateServiceInput): Promise<{ id: string }> {
    const name = assertName(input.name);
    assertDuration(input.duration);
    const parallelDuration = assertParallelDuration(input.parallelDuration);
    const variants = assertVariants(input.variants);
    const existing = await this.services.findByName(name, input.duration);
    if (existing) throw new ServiceCodeTakenError();
    const service = Service.create({
      id: uuidv7(),
      name,
      duration: input.duration,
      parallelDuration,
      description: input.description?.trim() || null,
      category: input.category?.trim() || null,
      slug: input.slug?.trim() || null,
      seoDescription: input.seoDescription?.trim() || null,
      faq: input.faq ?? null,
      variants,
      active: true,
      sortOrder: input.sortOrder ?? 0,
    });
    await this.services.save(service);
    return { id: service.id };
  }
}

export function assertName(name: string): string {
  if (!name || name.trim().length === 0) throw new InvalidServiceInputError('Name is required');
  return name;
}

export function assertDuration(duration: number): number {
  if (!Number.isInteger(duration) || duration < 5 || duration > 480)
    throw new InvalidServiceInputError('Duration must be 5..480 minutes');
  return duration;
}

/**
 * Кожен варіант проходить ту саму перевірку, що й у домені (T-4419). Доменну
 * помилку перекладаємо в помилку вводу, щоб фільтр віддав клієнтові 400.
 */
export function assertVariants(
  variants: DurationVariant[] | null | undefined
): DurationVariant[] | null {
  if (variants == null) return null;
  return variants.map((variant) => {
    try {
      return assertDurationVariant(variant);
    } catch (error) {
      if (error instanceof InvalidDurationVariantError) {
        throw new InvalidServiceInputError(error.message);
      }
      throw error;
    }
  });
}

export function assertParallelDuration(duration: number | null | undefined): number | null {
  if (duration != null && (!Number.isInteger(duration) || duration < 5 || duration > 480))
    throw new InvalidServiceInputError('Parallel duration must be 5..480 minutes');
  return duration ?? null;
}
