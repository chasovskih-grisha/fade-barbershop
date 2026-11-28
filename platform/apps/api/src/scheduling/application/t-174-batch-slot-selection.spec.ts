// Специфікація T-174: пакетний підбір слотів для групи та групове бронювання.
// Use case перевіряється з in-memory портами — без Prisma і без HTTP, рівно те,
// що обіцяє задача: підбір до groupSize слотів і створення рівно groupSize записів.
import { SLOTS, harness } from './t-174-batch-slot-selection.fakes';

describe('T174BatchSlotSelectionUseCase', () => {
  it('picks one slot per group member and reports the estimated price', async () => {
    const { useCase, calls } = harness();

    const result = await useCase.findBatchSlots({
      clientId: 'client-1',
      preferredServices: ['service-cut'],
      groupSize: 2,
      preferredDate: '2026-11-20',
      fallbackEnabled: true,
    });

    expect(result.success).toBe(true);
    expect(result.selectedSlots).toHaveLength(2);
    expect(result.selectedSlots.map((slot) => slot.slotId)).toEqual(['slot-1', 'slot-2']);
    expect(result.selectedSlots[0]).toMatchObject({ barberId: 'barber-1', serviceId: 'service-cut' });
    expect(result.totalEstimatedPrice).toBe(20000); // дві послуги по 100.00 UAH у копійках
    expect(result.rejectedReasons).toBeUndefined();
    expect(calls[0]).toEqual({
      serviceIds: ['service-cut'],
      groupSize: 2,
      preferredDate: '2026-11-20',
    });
  });

  it('reports the shortfall when fewer slots exist than the group size', async () => {
    const { useCase } = harness({ slots: SLOTS.slice(0, 2) });

    const result = await useCase.findBatchSlots({
      clientId: 'client-1',
      preferredServices: ['service-cut'],
      groupSize: 3,
      fallbackEnabled: true,
    });

    expect(result.success).toBe(true);
    expect(result.selectedSlots).toHaveLength(2);
    expect(result.rejectedReasons).toEqual(['Not all group members could be accommodated']);
  });

  it('fails clearly when no slots match', async () => {
    const { useCase } = harness({ slots: [] });

    const result = await useCase.findBatchSlots({
      clientId: 'client-1',
      preferredServices: ['service-cut'],
      groupSize: 2,
      fallbackEnabled: true,
    });

    expect(result).toEqual({
      success: false,
      selectedSlots: [],
      rejectedReasons: ['No available slots matching criteria'],
      totalEstimatedPrice: 0,
    });
  });

  it('fails clearly when the client does not exist', async () => {
    const { useCase, waitlistQueue } = harness({ knownClient: false });

    const result = await useCase.findBatchSlots({
      clientId: 'ghost',
      preferredServices: ['service-cut'],
      groupSize: 1,
      fallbackEnabled: true,
    });

    expect(result.success).toBe(false);
    expect(result.rejectedReasons).toEqual(['Client not found']);
    expect(waitlistQueue.getAvailableSlots).not.toHaveBeenCalled();
  });
});
