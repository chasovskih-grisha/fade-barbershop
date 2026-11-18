import { PrismaCatalogAuditRepository } from './prisma-catalog-audit.repository';

describe('PrismaCatalogAuditRepository', () => {
  it('records actor and before/after values for catalog changes', async () => {
    const create = jest.fn().mockResolvedValue(undefined);
    const repository = new PrismaCatalogAuditRepository({ catalogAudit: { create } } as never);
    await repository.record({
      actorId: 'admin-1',
      objectType: 'service-price',
      objectId: 'service-1:location-1',
      before: { amount: 300, active: true },
      after: { amount: 450, active: true },
    });
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: 'admin-1',
        objectType: 'service-price',
        objectId: 'service-1:location-1',
        before: { amount: 300, active: true },
        after: { amount: 450, active: true },
      }),
    });
  });

  it('updates the price and writes its audit record in one transaction', async () => {
    const create = jest.fn().mockResolvedValue(undefined);
    const upsert = jest.fn().mockResolvedValue(undefined);
    const tx = {
      servicePrice: {
        findUnique: jest.fn().mockResolvedValue({ amount: 300, active: true }),
        upsert,
      },
      catalogAudit: { create },
    };
    const transaction = jest.fn(async (work: (client: typeof tx) => Promise<void>) => work(tx));
    const repository = new PrismaCatalogAuditRepository({ $transaction: transaction } as never);
    await repository.savePriceChange(
      {
        serviceId: 'service-1',
        locationId: 'location-1',
        amount: 450,
        active: true,
        updatedAt: new Date(),
      },
      'admin-1'
    );
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: 'admin-1',
        before: { amount: 300, active: true },
        after: { amount: 450, active: true },
      }),
    });
  });
});
