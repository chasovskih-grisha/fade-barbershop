import { UpdatePreferencesHandler, SetVipDiscountHandler, ListClientsHandler } from './crm-handlers';
import { crmHandlersSetup } from './crm-handlers-setup';

describe('CRM VIP, preferences, list', () => {
  it('VIP-знижка пише снепшот до/після в подію; вподобання перезаписуються', async () => {
    const { ctx, events } = crmHandlersSetup();
    await new SetVipDiscountHandler(ctx).handle({
      clientId: 'p-1',
      percent: 20,
      changedBy: 'admin-1',
    });
    expect(events[0]).toMatchObject({
      type: 'crm.vip_discount.changed',
      payload: { oldPercent: 10, newPercent: 20, changedBy: 'admin-1' },
    });
    await new UpdatePreferencesHandler(ctx).handle({
      clientId: 'p-1',
      preferences: ['кава', 'тиха музика'],
    });
    expect(events.at(-1)?.type).toBe('crm.preferences.updated');
  });

  it('список клієнтів повертає прочитаний набір', async () => {
    const { ctx } = crmHandlersSetup();
    const out = await new ListClientsHandler(ctx.profiles).handle({});
    expect(out.clients).toHaveLength(1);
    expect(out.total).toBe(1);
  });
});
