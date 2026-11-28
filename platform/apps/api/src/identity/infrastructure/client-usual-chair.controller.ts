// Звична локація і барбер у профілі клієнта (T-4725b): PATCH
// /identity/profile/usual-chair за ClientSessionGuard. Окремий контролер від
// client-profile.controller.ts — той самий поділ, що й у client-birthday.
// Моститься на UpdateUsualChairHandler (crm): null очищає поле, друге
// лишається як було. Записи не переносяться — це вподобання, не візит.
import {
  Controller,
  Patch,
  Body,
  UseGuards,
  UseFilters,
  Inject,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientSessionGuard, clientSessionOf, type ClientSession } from './client-session.guard';
import { CrmExceptionFilter } from '../../crm/infrastructure/crm.exception-filter';
import {
  ADMIN_CLIENTS_HANDLERS,
  type AdminClientsHandlers,
} from '../../crm/infrastructure/admin-clients-handlers';
import { toProfileResult } from './client-profile.mapper';
import type { ClientProfileResult } from '@fade/contracts';
import { PatchProfileUsualChairInputDto } from './profile-dto.input';

@Controller('identity/profile')
@UseGuards(ClientSessionGuard)
@UseFilters(CrmExceptionFilter)
export class ClientUsualChairController {
  constructor(@Inject(ADMIN_CLIENTS_HANDLERS) private readonly handlers: AdminClientsHandlers) {}

  @Patch('usual-chair')
  async patchUsualChair(
    @Req() req: { clientSession?: ClientSession },
    @Body() dto: PatchProfileUsualChairInputDto
  ): Promise<ClientProfileResult> {
    const session = clientSessionOf(req as never);
    if (!session) throw new UnauthorizedException('Client session required');

    const { client: found } = await this.handlers.getProfileByUserId.handle({
      userId: session.userId,
    });

    // Поле, якого немає в тілі, не змінюється: null очищає, undefined — «не чіпай».
    const { client } = await this.handlers.updateUsualChair.handle({
      clientId: found.id,
      ...(dto.locationId !== undefined ? { locationId: dto.locationId } : {}),
      ...(dto.barberId !== undefined ? { barberId: dto.barberId } : {}),
    });
    return toProfileResult(client);
  }
}
