// ClientProfileRepository — порт збереження профілів (crm). VisitSummary —
// read-model візиту з Scheduling (перегляд історії — через цей порт, не через
// спільні entity між контекстами).
import type { ClientId, ClientProfile } from './client-profile';

export interface VisitSummary {
  id: string;
  date: Date;
  serviceName: string;
  barberName: string;
  locationName: string;
  agreedPrice: number;
  finalPrice: number;
  status: string;
}

export interface ClientProfileListFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ClientProfileRepository {
  findById(id: ClientId): Promise<ClientProfile | null>;
  findByUserId(userId: string): Promise<ClientProfile | null>;
  findByPhone(phone: string): Promise<ClientProfile | null>;
  save(profile: ClientProfile): Promise<void>;
  list(filters?: ClientProfileListFilters): Promise<ClientProfile[]>;
}
