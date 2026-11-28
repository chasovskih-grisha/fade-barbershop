// T-041: одна підготовка послуги для адмінки й клієнта. T-4419: варіант
// задає тривалість і поправку до ціни, без варіанта — як раніше.
import { prepareService } from './service-preparation';
import { dayOfWeekFor } from '../domain/day-of-week';

const repo = (
  price: { amount: number; active?: boolean } | null,
  service: { duration: number; parallelDuration: number | null; active?: boolean } | null
) =>
  ({
    find: jest.fn().mockResolvedValue(price === null ? null : { active: true, ...price }),
    findById: jest.fn().mockResolvedValue(service === null ? null : { active: true, ...service }),
  }) as never;

describe('service-preparation (T-041, спільна валідація каталогу)', () => {
  it('без serviceId: тривалість 30 за замовчуванням або явна serviceDuration', async () => {
    await expect(prepareService(repo(null, null), { locationId: 'loc-1' })).resolves.toEqual({
      duration: 30,
    });
    // prettier-ignore
    await expect(prepareService(repo(null, null), { locationId: 'loc-1', serviceDuration: 50 })).resolves.toEqual({ duration: 50 });
  });

  it('активна послуга: снепшот AgreedPrice локації; parallel бере parallelDuration', async () => {
    // prettier-ignore
    const ok = await prepareService(repo({ amount: 600 }, { duration: 50, parallelDuration: 45 }), { locationId: 'loc-1', serviceId: 'svc-1' });
    expect(ok).toEqual({
      duration: 50,
      snapshot: {
        serviceId: 'svc-1',
        agreedPrice: 600,
        agreedDuration: 50,
        fulfillmentMode: 'sequential',
      },
    });
    // prettier-ignore
    const par = await prepareService(repo({ amount: 900 }, { duration: 90, parallelDuration: 50 }), { locationId: 'loc-1', serviceId: 'svc-2', fulfillmentMode: 'parallel' });
    expect(par).toMatchObject({
      duration: 50,
      snapshot: { fulfillmentMode: 'parallel', agreedDuration: 50 },
    });
  });

  it('неактивна ціна або послуга → HttpException 404; parallel без тривалості → 400', async () => {
    // prettier-ignore
    await expect(prepareService(repo({ amount: 600, active: false }, { duration: 50, parallelDuration: null }), { locationId: 'l', serviceId: 's' })).rejects.toMatchObject({ status: 404 });
    await expect(
      prepareService(repo(null, { duration: 50, parallelDuration: null }), {
        locationId: 'l',
        serviceId: 's',
      })
    ).rejects.toMatchObject({ status: 404 });
    // prettier-ignore
    await expect(prepareService(repo({ amount: 600 }, { duration: 50, parallelDuration: null, active: false }), { locationId: 'l', serviceId: 's' })).rejects.toMatchObject({ status: 404 });
    await expect(
      // prettier-ignore
      prepareService(repo({ amount: 600 }, { duration: 90, parallelDuration: null }), { locationId: 'l', serviceId: 's', fulfillmentMode: 'parallel' })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      // prettier-ignore
      prepareService(repo({ amount: 600 }, { duration: 90, parallelDuration: 0 }), { locationId: 'l', serviceId: 's', fulfillmentMode: 'parallel' })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('dayOfWeekFor: понеділок 0, неділя 6 (Monday-first модель тижня)', () => {
    expect(dayOfWeekFor('2026-11-09')).toBe(0); // понеділок
    expect(dayOfWeekFor('2026-11-15')).toBe(6); // неділя
  });

  it('варіант задає тривалість і поправку до ціни (T-4419 S2)', async () => {
    const variants = [
      { label: 'short', duration: 30, parallelDuration: 25, priceDelta: 0, description: null },
      { label: 'long', duration: 60, parallelDuration: 50, priceDelta: 150, description: null },
    ];
    const prepared = await prepareService(
      repo({ amount: 600 }, { duration: 45, parallelDuration: null, variants } as never),
      { locationId: 'l', serviceId: 's', variantLabel: 'long' }
    );
    expect(prepared).toMatchObject({
      duration: 60,
      snapshot: { agreedPrice: 750, agreedDuration: 60, durationVariant: 'long' },
    });
  });

  it('без варіанта — базова тривалість і ціна (T-4419 back-compat)', async () => {
    const prepared = await prepareService(
      repo({ amount: 600 }, { duration: 45, parallelDuration: null } as never),
      { locationId: 'l', serviceId: 's' }
    );
    expect(prepared).toMatchObject({
      duration: 45,
      snapshot: { agreedPrice: 600, agreedDuration: 45 },
    });
    expect(prepared.snapshot?.durationVariant).toBeUndefined();
  });

  it('невідомий варіант — 400, а не відкат до базової тривалості (T-4419 S2)', async () => {
    const variants = [
      { label: 'long', duration: 60, parallelDuration: 50, priceDelta: 150, description: null },
    ];
    await expect(
      prepareService(
        repo({ amount: 600 }, { duration: 45, parallelDuration: null, variants } as never),
        { locationId: 'l', serviceId: 's', variantLabel: 'huge' }
      )
    ).rejects.toMatchObject({ status: 400 });
  });

  it('варіант на послузі без варіантів — теж 400 (T-4419 S2)', async () => {
    await expect(
      prepareService(repo({ amount: 600 }, { duration: 45, parallelDuration: null }), {
        locationId: 'l',
        serviceId: 's',
        variantLabel: 'long',
      })
    ).rejects.toMatchObject({ status: 400 });
  });
});
