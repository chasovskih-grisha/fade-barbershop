// Причини блокування нового онлайн-запису (T-4542) — окремо від use case,
// щоб тримати і клас, і функцію під гейтами max-lines/max-params.
import type { OnlineBookingPolicy } from './online-booking-policy';
import {
  checkActiveBookings,
  checkDuplicate,
  checkHorizon,
  checkLeadTime,
  checkNoShowBlock,
  type BookingBlock,
} from './policy-rules';
import type { OnlineBookingStore } from './booking-policy.ports';
import type { EvaluateInput } from './evaluate-online-booking';

/** Причини блокування нового онлайн-запису (окрема функція — гейт max-params). */
export interface CreateBlocksArgs {
  store: OnlineBookingStore;
  input: EvaluateInput;
  policy: OnlineBookingPolicy;
  now: Date;
}

export async function createBlocks({ store, input, policy, now }: CreateBlocksArgs): Promise<BookingBlock[]> {
  const blocks: BookingBlock[] = [];
  const push = (block: BookingBlock | null): void => {
    if (block) blocks.push(block);
  };
  push(checkLeadTime(policy, input.start, now));
  push(checkHorizon(policy, input.start, now));
  if (!input.clientId) return blocks;
  push(checkActiveBookings(policy, await store.countActiveBookings(input.clientId, now)));
  push(
    checkNoShowBlock(
      policy,
      await store.countNoShows(
        input.clientId,
        new Date(now.getTime() - policy.noShowBlock.windowDays * 24 * 60 * 60 * 1000)
      )
    )
  );
  if (!input.barberId) return blocks;
  push(checkDuplicate(await store.hasDuplicate({ clientId: input.clientId, barberId: input.barberId, start: input.start })));
  return blocks;
}
