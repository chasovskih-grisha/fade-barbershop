// EvaluateOnlineBooking (T-4542): одна перевірка для book / cancel /
// reschedule. Повертає всі причини одразу (фронт показує їх списком), а не
// першу-ліпшу; кидок — лише через OnlineBookingBlockedError в guard-і.
import { mergePolicy, type OnlineBookingPolicy } from './online-booking-policy';
import {
  checkCancellationDeadline,
  checkGuestBooking,
  checkRescheduleDeadline,
  type BookingBlock,
} from './policy-rules';
import { createBlocks } from './evaluate-online-booking.create';
import type { OnlineBookingStore } from './booking-policy.ports';

export type BookingAction = 'create' | 'cancel' | 'reschedule';

export interface EvaluateInput {
  locationId: string;
  action: BookingAction;
  start: Date;
  clientId?: string | null;
  barberId?: string;
  /** Клієнт увійшов (для guest booking); дефолт — за наявності clientId. */
  hasAccount?: boolean;
}

export interface EvaluateResult {
  allowed: boolean;
  policy: OnlineBookingPolicy;
  blocks: BookingBlock[];
}

export interface EvaluateDeps {
  store: OnlineBookingStore;
  clock?: { now(): Date };
}

export class OnlineBookingBlockedError extends Error {
  constructor(readonly blocks: BookingBlock[]) {
    super(blocks.map((block) => block.code).join(', '));
    this.name = 'OnlineBookingBlockedError';
  }
}

export class EvaluateOnlineBooking {
  constructor(private readonly deps: EvaluateDeps) {}

  async execute(input: EvaluateInput): Promise<EvaluateResult> {
    const policy = mergePolicy(await this.deps.store.policyFor(input.locationId));
    const now = this.deps.clock?.now() ?? new Date();
    const blocks: BookingBlock[] = [];
    const push = (block: BookingBlock | null): void => {
      if (block) blocks.push(block);
    };
    push(checkGuestBooking(policy, input.hasAccount ?? Boolean(input.clientId)));
    if (input.action === 'create') {
      for (const block of await createBlocks({ store: this.deps.store, input, policy, now })) {
        blocks.push(block);
      }
    }
    if (input.action === 'cancel') push(checkCancellationDeadline(policy, input.start, now));
    if (input.action === 'reschedule') push(checkRescheduleDeadline(policy, input.start, now));
    return { allowed: blocks.length === 0, policy, blocks };
  }

}
