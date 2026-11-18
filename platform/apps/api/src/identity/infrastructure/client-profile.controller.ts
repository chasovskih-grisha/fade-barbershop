// Клієнтський профіль (T-??): картка гостя з crm, доступна за ClientSessionGuard.
// Моститься на CRM-хендлери: GET — GetClientProfileByUserIdHandler, PATCH name —
// UpdateClientProfileHandler, PATCH preferences — UpdatePreferencesHandler.
// CRM-експешн-фільтр перекладає ClientProfileNotFoundError на 404.
// Валідація вводу — class-validator DTO + ValidationPipe.

import { Controller, Get, Patch, Body, UseGuards, UseFilters, Inject, Req, UnauthorizedException } from '@nestjs/common';
import { ClientSessionGuard, clientSessionOf, type ClientSession } from './client-session.guard';
import { CrmExceptionFilter } from '../../crm/infrastructure/crm.exception-filter';
import { ADMIN_CLIENTS_HANDLERS, type AdminClientsHandlers } from '../../crm/infrastructure/admin-clients-handlers';
import { toProfileResult } from './client-profile.mapper';
import type { ClientProfileResult, PatchProfilePreferencesResult } from '@fade/contracts';
import { PatchProfileNameInputDto, PatchProfilePreferencesInputDto } from './profile-dto.input';

function requireClientSession(req: { clientSession?: ClientSession }): ClientSession {
  const session = clientSessionOf(req as never);
  if (!session) throw new UnauthorizedException('Client session required');
  return session;
}

@Controller('identity/profile')
@UseGuards(ClientSessionGuard)
@UseFilters(CrmExceptionFilter)
export class ClientProfileController {
  constructor(@Inject(ADMIN_CLIENTS_HANDLERS) private readonly handlers: AdminClientsHandlers) {}

  @Get()
  async getProfile(@Req() req: { clientSession?: ClientSession }): Promise<ClientProfileResult> {
    const session = requireClientSession(req);
    const { client } = await this.handlers.getProfileByUserId.handle({ userId: session.userId });
    return toProfileResult(client);
  }

  @Patch('name')
  async patchName(
    @Req() req: { clientSession?: ClientSession },
    @Body() dto: PatchProfileNameInputDto
  ): Promise<ClientProfileResult> {
    const session = requireClientSession(req);
    const { client: found } = await this.handlers.getProfileByUserId.handle({
      userId: session.userId,
    });
    const effectiveName: string | null =
      dto.nameExplicitNull !== undefined ? null : (dto.name ?? null);

    const { client } = await this.handlers.updateProfile.handle({
      clientId: found.id,
      name: effectiveName,
    });
    return toProfileResult(client);
  }

  @Patch('preferences')
  async patchPreferences(
    @Req() req: { clientSession?: ClientSession },
    @Body() dto: PatchProfilePreferencesInputDto
  ): Promise<PatchProfilePreferencesResult> {
    const session = requireClientSession(req);
    const { client: found } = await this.handlers.getProfileByUserId.handle({
      userId: session.userId,
    });
    const { client } = await this.handlers.updatePreferences.handle({
      clientId: found.id,
      preferences: dto.preferences,
    });
    return {
      preferences: client.preferences.map((p) => ({
        id: p.id,
        text: p.text,
        createdAt: p.createdAt.toISOString(),
      })),
    };
  }
}
