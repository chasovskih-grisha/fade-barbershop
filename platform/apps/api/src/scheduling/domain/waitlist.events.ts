// Доменні події черги (T-170a: «Events and statuses», ADR 0012).
// Імена — `scheduling.waitlist.*`; outbox-реле читає type + payload, як для
// appointment-подій. Payload — лише рядки, без грошей і PII.
import { DomainEvent } from '../../locations/domain/location.events';
import type { WaitlistEntryData } from './waitlist-queue';
import { configurationKey } from './waitlist-status';

export interface WaitlistEventInput {
  entry: WaitlistEntryData;
  occurredAt?: Date;
  actorId?: string;
  reason?: string;
}

abstract class WaitlistEvent extends DomainEvent {
  readonly payload: Record<string, string>;
  constructor(input: WaitlistEventInput, payload: Record<string, string>) {
    super({ occurredAt: input.occurredAt ?? new Date(), aggregateId: input.entry.id });
    this.payload = payload;
  }
}

const entryFields = (input: WaitlistEventInput) => ({
  entryId: input.entry.id,
  clientId: input.entry.clientId,
  configurationId: configurationKey(input.entry.configuration),
});

const actorFields = (input: WaitlistEventInput) => ({
  ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
  ...(input.reason === undefined ? {} : { reason: input.reason }),
});

export class WaitlistEntryJoined extends WaitlistEvent {
  readonly type = 'scheduling.waitlist.joined';
  constructor(input: WaitlistEventInput) {
    super(input, {
      ...entryFields(input),
      windowFrom: input.entry.configuration.windowFrom,
      windowTo: input.entry.configuration.windowTo,
      precision: input.entry.configuration.precision,
    });
  }
}

export class WaitlistOfferSent extends WaitlistEvent {
  readonly type = 'scheduling.waitlist.offer_sent';
  constructor(input: WaitlistEventInput) {
    super(input, {
      ...entryFields(input),
      ...(input.entry.holdExpiresAt === undefined
        ? {}
        : { holdExpiresAt: input.entry.holdExpiresAt.toISOString() }),
    });
  }
}

export class WaitlistOfferAccepted extends WaitlistEvent {
  readonly type = 'scheduling.waitlist.offer_accepted';
  constructor(input: WaitlistEventInput) {
    super(input, entryFields(input));
  }
}

export class WaitlistOfferSkipped extends WaitlistEvent {
  readonly type = 'scheduling.waitlist.offer_skipped';
  constructor(input: WaitlistEventInput) {
    super(input, { ...entryFields(input), ...actorFields(input) });
  }
}

export class WaitlistOfferExpired extends WaitlistEvent {
  readonly type = 'scheduling.waitlist.offer_expired';
  constructor(input: WaitlistEventInput) {
    super(input, entryFields(input));
  }
}

export class WaitlistEntryPaused extends WaitlistEvent {
  readonly type = 'scheduling.waitlist.paused';
  constructor(input: WaitlistEventInput) {
    super(input, {
      ...entryFields(input),
      consecutiveMisses: String(input.entry.consecutiveMisses),
      ...actorFields(input),
    });
  }
}

export class WaitlistOverrideApplied extends WaitlistEvent {
  readonly type = 'scheduling.waitlist.override_applied';
  constructor(input: WaitlistEventInput) {
    super(input, {
      ...entryFields(input),
      ...(input.entry.override === undefined ? {} : { actorId: input.entry.override.by }),
      ...(input.entry.override === undefined ? {} : { reason: input.entry.override.reason }),
    });
  }
}
