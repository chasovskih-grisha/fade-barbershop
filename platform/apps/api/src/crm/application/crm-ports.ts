// Спільний контекст команд crm (bundle замість 4–6 позиційних залежностей —
// гейт max-params): усе, що потрібно use case'ам для транзакції і подій.
import type { ClientProfileRepository } from '../domain/client-profile.repository';
import type { Clock, IdGenerator, Outbox, UnitOfWork } from '../domain/ports';

export interface CrmCommandContext {
  profiles: ClientProfileRepository;
  outbox: Outbox;
  clock: Clock;
  ids: IdGenerator;
  uow: UnitOfWork;
}
