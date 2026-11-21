// Специфікація спільної підготовки послуги (T-041): адмінський і клієнтський
// контролери ведуть той самий BookAppointment, тож валідація каталогу одна —
// активність послуги/ціни (MNG-ADM-10…12), тривалість за режимом, снепшот
// ціни (ADR 0006). Гілки: без serviceId (дефолт 30/явна), неактивні → 404,
// parallel → parallelDuration (0 → 400), dayOfWeekFor (Пн/Нд).
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
});
