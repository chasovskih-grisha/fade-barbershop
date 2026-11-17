// Нотатки картки гостя як підресурс CRM (POST/DELETE /admin/clients/:id/notes).
// Окремий контролер за LOC-гейтом; той самий токен-об'єкт хендлерів.
import { Body, Controller, Delete, Inject, Param, Post, UseFilters } from '@nestjs/common';
import { CrmExceptionFilter } from './crm.exception-filter';
import { ADMIN_CLIENTS_HANDLERS, type AdminClientsHandlers } from './admin-clients-handlers';
import { toClientDto, type ClientProfileDto } from './client-profile.dto';

@Controller('admin/clients')
@UseFilters(CrmExceptionFilter)
export class AdminClientNotesController {
  constructor(@Inject(ADMIN_CLIENTS_HANDLERS) private readonly handlers: AdminClientsHandlers) {}

  @Post(':clientId/notes')
  async addNote(
    @Param('clientId') clientId: string,
    @Body()
    body: {
      text: string;
      authorId: string;
      authorRole: 'barber' | 'admin';
      visibleToClient?: boolean;
    }
  ): Promise<{ client: ClientProfileDto; note: unknown }> {
    const result = await this.handlers.addNote.handle({ clientId, ...body });
    return { client: toClientDto(result.client), note: result.note };
  }

  @Delete(':clientId/notes/:noteId')
  async removeNote(
    @Param('clientId') clientId: string,
    @Param('noteId') noteId: string
  ): Promise<ClientProfileDto> {
    return toClientDto((await this.handlers.removeNote.handle({ clientId, noteId })).client);
  }
}
