import { ClientLoyaltyState } from './client-loyalty-state';
import { DomainEvent } from './domain-event';

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  id(): string;
}

export interface ClientLoyaltyStateRepository {
  findByClientId(clientId: string): Promise<ClientLoyaltyState | null>;
  save(state: ClientLoyaltyState): Promise<void>;
  findAll?(): Promise<ClientLoyaltyState[]>;
}

export interface OutboxPublisher {
  append(events: DomainEvent[]): Promise<void>;
}

export interface LoyaltyCommandContext {
  states: ClientLoyaltyStateRepository;
  outbox: OutboxPublisher;
  clock: Clock;
  threshold?: number; // default 7
}
