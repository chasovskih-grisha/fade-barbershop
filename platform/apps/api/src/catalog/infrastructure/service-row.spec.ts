import { Prisma } from '@prisma/client';
import { Service } from '../domain/service';
import type { DurationVariant } from '../domain/duration-variant';
import { serviceUpsertData, toService } from './service-row';

// T-4419 S1: варіанти їдуть у JSON-колонку й читаються назад тим самим
// мапінгом; послуга без варіантів пише DbNull, а не порожній масив.

const variants: DurationVariant[] = [
  { label: 'short', duration: 30, parallelDuration: 25, priceDelta: 0, description: null },
];

const row = (durationVariants: unknown) =>
  ({
    id: 'service-1',
    name: 'Haircut',
    duration: 45,
    parallelDuration: null,
    description: null,
    category: null,
    slug: null,
    seoDescription: null,
    faq: null,
    durationVariants,
    active: true,
    sortOrder: 0,
    createdAt: new Date('2026-11-27T10:00:00Z'),
    updatedAt: new Date('2026-11-27T10:00:00Z'),
  }) as never;

describe('service row mapping (T-4419 S1)', () => {
  it('reads the stored variants back into the entity', () => {
    expect(toService(row(variants)).variants).toEqual(variants);
  });

  it('treats a null column as a service without variants', () => {
    expect(toService(row(null)).variants).toBeNull();
  });

  it('writes DbNull for a service without variants and the list when it has them', () => {
    const plain = Service.create({
      id: 'service-1',
      name: 'Beard',
      duration: 30,
      parallelDuration: null,
      description: null,
      category: null,
      slug: null,
      seoDescription: null,
      faq: null,
      active: true,
      sortOrder: 0,
    });
    expect(serviceUpsertData(plain.propsData).durationVariants).toBe(Prisma.DbNull);

    const withVariants = Service.create({ ...plain.propsData, variants });
    expect(serviceUpsertData(withVariants.propsData).durationVariants).toEqual(variants);
  });
});
