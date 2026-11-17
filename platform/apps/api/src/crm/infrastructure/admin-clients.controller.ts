// HTTP-поверхня CRM в адмінці: розкриває use cases як ендпоінти. Десять
// хендлерів зібрані в один токен-об'єкт (гейт max-params на конструкторі) —
// збірка в crm.module.ts, конвенція як CLIENT_BOOKINGS_IO (scheduling).
// Агрегат ClientProfile серіалізується плоским DTO (propsData): JSON
// приватного поля props ламав адмінку — усі поля опинялись у {props:{...}}.
// Нотаткові ендпоінти — admin-client-notes.controller.ts (LOC-гейт).
import { Body, Controller, Get, Inject, Patch, Param, Query, UseFilters } from '@nestjs/common';
import { CrmExceptionFilter } from './crm.exception-filter';
import { ADMIN_CLIENTS_HANDLERS, type AdminClientsHandlers } from './admin-clients-handlers';
import { toClientDto, type ClientProfileDto } from './client-profile.dto';
import { AdminClientList } from '../application/admin-client-list';
import type { ClientListResult } from '../application/admin-client-list.view';

export { ADMIN_CLIENTS_HANDLERS, type AdminClientsHandlers } from './admin-clients-handlers';

@Controller('admin/clients')
@UseFilters(CrmExceptionFilter)
export class AdminClientsController {
  constructor(
    @Inject(ADMIN_CLIENTS_HANDLERS) private readonly handlers: AdminClientsHandlers,
    private readonly clientList: AdminClientList
  ) {}

  /**
   * Список клієнтів (T-4606a/T-4606b): search/locationId/loyaltyStatus/sort/
   * order/page/perPage/period → {items,total,page,pages,summary}; валідація й
   * 400 — у read-моделі через CrmExceptionFilter. `period` (7d/30d/90d) звужує
   * лише вікно підсумків — таблиця і пагінація від нього не залежать.
   * Старі limit/offset більше не читаються.
   */
  @Get()
  async list(@Query() query: Record<string, string | undefined>): Promise<ClientListResult> {
    return this.clientList.handle(query);
  }

  @Get('by-user/:userId')
  async byUserId(@Param('userId') userId: string): Promise<ClientProfileDto> {
    return toClientDto((await this.handlers.getProfileByUserId.handle({ userId })).client);
  }

  @Get('by-phone/:phone')
  async byPhone(@Param('phone') phone: string): Promise<ClientProfileDto> {
    return toClientDto((await this.handlers.getProfileByPhone.handle({ phone })).client);
  }

  @Get(':clientId')
  async get(@Param('clientId') clientId: string): Promise<ClientProfileDto> {
    return toClientDto((await this.handlers.getProfile.handle({ clientId })).client);
  }

  @Patch(':clientId')
  async update(
    @Param('clientId') clientId: string,
    @Body() body: { name?: string | null; phone?: string }
  ): Promise<ClientProfileDto> {
    return toClientDto((await this.handlers.updateProfile.handle({ clientId, ...body })).client);
  }

  @Patch(':clientId/preferences')
  async updatePreferences(
    @Param('clientId') clientId: string,
    @Body() body: { preferences: string[] }
  ): Promise<ClientProfileDto> {
    return toClientDto(
      (await this.handlers.updatePreferences.handle({ clientId, preferences: body.preferences }))
        .client
    );
  }

  @Patch(':clientId/vip-discount')
  async setVipDiscount(
    @Param('clientId') clientId: string,
    @Body() body: { percent: number | null; changedBy: string }
  ): Promise<ClientProfileDto> {
    return toClientDto((await this.handlers.setVipDiscount.handle({ clientId, ...body })).client);
  }

  @Patch(':clientId/loyalty-visits')
  async setLoyaltyVisits(
    @Param('clientId') clientId: string,
    @Body() body: { count: number; changedBy: string }
  ): Promise<ClientProfileDto> {
    return toClientDto((await this.handlers.setLoyaltyVisits.handle({ clientId, ...body })).client);
  }
}
