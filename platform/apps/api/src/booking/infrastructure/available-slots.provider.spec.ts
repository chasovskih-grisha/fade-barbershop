// T-4619a: BookingModule must give AvailableSlots the deposit-hold port so an
// expired hold frees the chair on a slot read, before the sweeper runs.
import { AvailableSlots } from './available-slots';
import { availableSlotsProvider } from './available-slots.provider';
import {
  DepositHoldService,
  InMemoryDepositHoldRepository,
} from '../../scheduling/application/deposit-hold.service';

describe('availableSlotsProvider (T-4619a)', () => {
  it('passes the deposit-hold port into slot reads', () => {
    const holds = new DepositHoldService(new InMemoryDepositHoldRepository());
    const slots = availableSlotsProvider.useFactory(
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      holds
    ) as unknown as { deps: { depositHolds?: unknown } };

    expect(slots).toBeInstanceOf(AvailableSlots);
    expect(slots.deps.depositHolds).toBe(holds);
  });
});
