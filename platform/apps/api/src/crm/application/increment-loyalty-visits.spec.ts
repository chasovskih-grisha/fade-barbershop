// Тести на автоінкремент візитів лояльності (T-140)
import { IncrementLoyaltyVisitsHandler } from './increment-loyalty-visits.use-case';
import { crmHandlersSetup } from './crm-handlers-setup';
import { ClientProfileNotFoundError } from './crm-errors';

describe('IncrementLoyaltyVisitsHandler (T-140)', () => {
  it('інкрементує лічильник візитів клієнта та викидає подію LoyaltyVisitsIncremented', async () => {
    const { ctx, events } = crmHandlersSetup();
    const handler = new IncrementLoyaltyVisitsHandler(ctx);

    const result = await handler.handle({
      appointmentId: 'appt-999',
      clientId: 'p-1',
      occurredAt: new Date('2026-11-10T12:00:00Z'),
    });

    expect(result).toEqual({ clientId: 'p-1', newCount: 3 }); // початковий злет fakes має 2 візити
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'crm.loyalty.visits_incremented',
      payload: {
        clientId: 'p-1',
        oldCount: 2,
        newCount: 3,
        appointmentId: 'appt-999',
      },
    });
  });

  it('кидає ClientProfileNotFoundError, якщо клієнта не знайдено', async () => {
    const { ctx } = crmHandlersSetup();
    const handler = new IncrementLoyaltyVisitsHandler(ctx);

    await expect(
      handler.handle({
        appointmentId: 'appt-999',
        clientId: 'non-existent',
        occurredAt: new Date('2026-11-10T12:00:00Z'),
      })
    ).rejects.toThrow(ClientProfileNotFoundError);
  });
});
