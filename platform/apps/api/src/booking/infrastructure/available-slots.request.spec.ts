import { resolveDuration } from './available-slots.request';

// T-4419 S2: обраний варіант задає тривалість слоту, а без варіанта лишається
// базова тривалість послуги; невідомий підпис — 400, а не тихий відкат.

const variants = [
  { label: 'short', duration: 30, parallelDuration: 25, priceDelta: 0, description: null },
  { label: 'long', duration: 60, parallelDuration: 50, priceDelta: 150, description: null },
];

const deps = () =>
  ({
    serviceRepo: {
      catalogForLocation: jest.fn().mockResolvedValue([
        {
          id: 'svc-1',
          name: 'Haircut',
          description: null,
          category: null,
          duration: 45,
          parallelDuration: null,
          price: 600,
          variants,
        },
      ]),
    },
  }) as never;

describe('resolveDuration — варіанти тривалості (T-4419 S2)', () => {
  it('takes the slot length from the selected variant', async () => {
    await expect(
      resolveDuration(deps(), { locationId: 'l', serviceId: 'svc-1', variantLabel: 'long' })
    ).resolves.toBe(60);
    await expect(
      resolveDuration(deps(), { locationId: 'l', serviceId: 'svc-1', variantLabel: 'short' })
    ).resolves.toBe(30);
  });

  it('keeps the base duration when no variant is selected', async () => {
    await expect(resolveDuration(deps(), { locationId: 'l', serviceId: 'svc-1' })).resolves.toBe(
      45
    );
  });

  it('aligns the variant length to the 15-minute grid', async () => {
    const uneven = variants.map((variant) =>
      variant.label === 'short' ? { ...variant, duration: 40 } : variant
    );
    const withUneven = {
      serviceRepo: {
        catalogForLocation: jest
          .fn()
          .mockResolvedValue([
            { id: 'svc-1', duration: 45, parallelDuration: null, variants: uneven },
          ]),
      },
    } as never;
    await expect(
      resolveDuration(withUneven, { locationId: 'l', serviceId: 'svc-1', variantLabel: 'short' })
    ).resolves.toBe(45);
  });

  it('answers an unknown variant with 400', async () => {
    await expect(
      resolveDuration(deps(), { locationId: 'l', serviceId: 'svc-1', variantLabel: 'huge' })
    ).rejects.toMatchObject({ status: 400 });
  });
});
