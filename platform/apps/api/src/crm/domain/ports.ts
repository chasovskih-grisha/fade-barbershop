// Порти crm — контракти, які домен і use cases вимагають від інфраструктури.
// Код домену залежить лише від цих інтерфейсів (напрям залежностей: infra → application → domain).

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  id(): string;
}

export interface Outbox {
  append(events: readonly { type: string; aggregateId: string; payload: unknown }[]): Promise<void>;
}

export interface UnitOfWork {
  run<T>(work: () => Promise<T>): Promise<T>;
}
