// Доменні події context locations. Імена за конвенцією packages/contracts/events.
export { DomainEvent } from '../../shared/domain/domain-event';
import { OutboxEvent } from '../../shared/domain/domain-event';

/** Шаблон «щось змінилося в локації» — payload лише з id. */
class LocationMutated extends OutboxEvent<{ id: string }> {
  constructor(
    readonly type: string,
    id: string,
    occurredAt: Date
  ) {
    super({ id, occurredAt }, id);
  }
}

export class LocationOpened extends OutboxEvent<{ id: string; code: string }> {
  readonly type = 'locations.location.opened';
  constructor(id: string, code: string, occurredAt: Date) {
    super({ id, code, occurredAt }, id);
  }
}

export class LocationDisabled extends LocationMutated {
  constructor(id: string, occurredAt: Date) {
    super('locations.location.disabled', id, occurredAt);
  }
}

export class LocationEnabled extends LocationMutated {
  constructor(id: string, occurredAt: Date) {
    super('locations.location.enabled', id, occurredAt);
  }
}

export class HoursChanged extends LocationMutated {
  constructor(id: string, occurredAt: Date) {
    super('locations.location.hours_changed', id, occurredAt);
  }
}

export class ChannelsChanged extends LocationMutated {
  constructor(id: string, occurredAt: Date) {
    super('locations.location.channels_changed', id, occurredAt);
  }
}

export class PhotosChanged extends LocationMutated {
  constructor(id: string, occurredAt: Date) {
    super('locations.location.photos_changed', id, occurredAt);
  }
}

/** Шаблон «зміна крісла номер N». */
class ChairEvent extends OutboxEvent<{ id: string; number: number }> {
  constructor(
    readonly type: string,
    input: { id: string; number: number; occurredAt: Date }
  ) {
    super(input, input.id);
  }
}

export class ChairAdded extends ChairEvent {
  constructor(id: string, number: number, occurredAt: Date) {
    super('locations.location.chair_added', { id, number, occurredAt });
  }
}

export class ChairUpdated extends ChairEvent {
  constructor(id: string, number: number, occurredAt: Date) {
    super('locations.location.chair_updated', { id, number, occurredAt });
  }
}

/** Шаблон «барбера призначено/знято з локації». */
class StaffEvent extends OutboxEvent<{ id: string; barberId: string; locationId: string }> {
  constructor(
    readonly type: string,
    input: { id: string; barberId: string; locationId: string; occurredAt: Date }
  ) {
    super(input, input.id);
  }
}

export class StaffAssigned extends StaffEvent {
  constructor(input: { id: string; barberId: string; locationId: string; occurredAt: Date }) {
    super('locations.staff.assigned', input);
  }
}

export class StaffUnassigned extends StaffEvent {
  constructor(input: { id: string; barberId: string; locationId: string; occurredAt: Date }) {
    super('locations.staff.unassigned', input);
  }
}
