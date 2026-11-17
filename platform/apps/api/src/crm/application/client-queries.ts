// Читання картки гостя (crm): профіль за id/userId/phone і список з пошуком.
// Запити без транзакції — read-шлях через порт репозиторію.
import { ClientProfile } from '../domain/client-profile';
import { ClientProfileNotFoundError } from './crm-errors';
import type { CrmCommandContext } from './crm-ports';

export interface GetClientProfileInput {
  clientId: string;
}

export interface GetClientProfileOutput {
  client: ClientProfile;
}

export class GetClientProfileHandler {
  constructor(private readonly profiles: CrmCommandContext['profiles']) {}

  async handle(input: GetClientProfileInput): Promise<GetClientProfileOutput> {
    const profile = await this.profiles.findById(input.clientId as never);
    if (!profile) throw new ClientProfileNotFoundError(input.clientId);
    return { client: profile };
  }
}

export interface GetClientProfileByUserIdInput {
  userId: string;
}

export interface GetClientProfileByUserIdOutput {
  client: ClientProfile;
}

export class GetClientProfileByUserIdHandler {
  constructor(private readonly profiles: CrmCommandContext['profiles']) {}

  async handle(input: GetClientProfileByUserIdInput): Promise<GetClientProfileByUserIdOutput> {
    const profile = await this.profiles.findByUserId(input.userId);
    if (!profile) throw new ClientProfileNotFoundError(input.userId);
    return { client: profile };
  }
}

export interface GetClientProfileByPhoneInput {
  phone: string;
}

export interface GetClientProfileByPhoneOutput {
  client: ClientProfile;
}

export class GetClientProfileByPhoneHandler {
  constructor(private readonly profiles: CrmCommandContext['profiles']) {}

  async handle(input: GetClientProfileByPhoneInput): Promise<GetClientProfileByPhoneOutput> {
    const profile = await this.profiles.findByPhone(input.phone);
    if (!profile) throw new ClientProfileNotFoundError(input.phone);
    return { client: profile };
  }
}

export interface ListClientsInput {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListClientsOutput {
  clients: ClientProfile[];
  total: number;
}

export class ListClientsHandler {
  constructor(private readonly profiles: CrmCommandContext['profiles']) {}

  async handle(input: ListClientsInput): Promise<ListClientsOutput> {
    const clients = await this.profiles.list({
      ...(input.search ? { search: input.search } : {}),
      limit: input.limit ?? 20,
      offset: input.offset ?? 0,
    });
    return { clients, total: clients.length };
  }
}
