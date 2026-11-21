// Клієнтський день народження (T-4730): PATCH /identity/profile/birthday —
// день і місяць без року, доступне за ClientSessionGuard. Окремий контролер
// від client-profile.controller.ts заради гейта max-lines. Моститься на
// UpdateBirthdayHandler (crm); порожнє значення очищає поле.
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
import { PatchProfileBirthdayInputDto } from './profile-dto.input';

@Controller('identity/profile')
@UseGuards(ClientSessionGuard)
@UseFilters(CrmExceptionFilter)
export class ClientBirthdayController {
  constructor(@Inject(ADMIN_CLIENTS_HANDLERS) private readonly handlers: AdminClientsHandlers) {}

  @Patch('birthday')
  async patchBirthday(
    @Req() req: { clientSession?: ClientSession },
    @Body() dto: PatchProfileBirthdayInputDto
  ): Promise<ClientProfileResult> {
    const session = clientSessionOf(req as never);
    if (!session) throw new UnauthorizedException('Client session required');

    const { client: found } = await this.handlers.getProfileByUserId.handle({
      userId: session.userId,
    });
    const birthday = dto.birthday ? { day: dto.birthday.day, month: dto.birthday.month } : null;

    const { client } = await this.handlers.updateBirthday.handle({
      clientId: found.id,
      birthday,
    });
    return toProfileResult(client);
  }
}
