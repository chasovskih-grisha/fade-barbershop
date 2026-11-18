import { Payment } from './payment.entity';
import { DomainEvent } from './domain-event';

export interface PaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByProviderSessionId(providerSessionId: string): Promise<Payment | null>;
  save(payment: Payment): Promise<void>;
}

export interface OutboxPublisher {
  append(events: DomainEvent[]): Promise<void>;
}

export interface PaymentCommandContext {
  payments: PaymentRepository;
  outbox: OutboxPublisher;
  clock: { now(): Date };
}
