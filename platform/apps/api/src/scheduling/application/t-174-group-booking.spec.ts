// T-174: групове бронювання створює рівно groupSize записів із джерелом waitlist_group.
import { harness } from './t-174-batch-slot-selection.fakes';

describe('T174BatchSlotSelectionUseCase — групове бронювання', () => {
  it('creates one booking per group member with the waitlist group source', async () => {
    const { useCase, created } = harness();

    const result = await useCase.createGroupBooking({
      clientId: 'client-1',
      assignedBarberId: 'barber-1',
      serviceId: 'service-cut',
      slotId: 'slot-1',
      groupSize: 3,
      notes: 'День народження',
    });

    expect(result.success).toBe(true);
    expect(result.bookingIds).toHaveLength(3);
    expect(created).toHaveLength(3);
    for (const record of created) {
      expect(record).toMatchObject({
        clientId: 'client-1',
        barberId: 'barber-1',
        serviceId: 'service-cut',
        status: 'booked',
        source: 'waitlist_group',
        notes: 'День народження',
      });
    }
    expect(result.summary).toContain('3');
  });
});
