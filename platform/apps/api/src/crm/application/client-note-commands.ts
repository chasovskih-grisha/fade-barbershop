// Нотатки барбера (crm): додати і видалити нотатку на картці гостя.
// Один use case — одна причина зміни; спільний контекст — CrmCommandContext.
import { ClientProfile } from '../domain/client-profile';
import { NoteAdded, NoteRemoved } from '../domain/events';
import { ClientProfileNotFoundError, NoteNotFoundError } from './crm-errors';
import type { CrmCommandContext } from './crm-ports';

export interface AddNoteInput {
  clientId: string;
  text: string;
  authorId: string;
  authorRole: 'barber' | 'admin';
  visibleToClient?: boolean;
}

export interface AddNoteOutput {
  client: ClientProfile;
  note: {
    id: string;
    text: string;
    authorId: string;
    authorRole: 'barber' | 'admin';
    visibleToClient: boolean;
    createdAt: Date;
  };
}

export class AddNoteHandler {
  constructor(private readonly ctx: CrmCommandContext) {}

  async handle(input: AddNoteInput): Promise<AddNoteOutput> {
    return this.ctx.uow.run(async () => {
      const profile = await this.ctx.profiles.findById(input.clientId as never);
      if (!profile) throw new ClientProfileNotFoundError(input.clientId);

      const note = profile.addNote(input, this.ctx.clock, this.ctx.ids);
      await this.ctx.outbox.append([
        new NoteAdded({
          clientId: profile.id,
          noteId: note.id,
          text: note.text,
          authorId: note.authorId,
          authorRole: note.authorRole,
          visibleToClient: note.visibleToClient,
          createdAt: note.createdAt,
          occurredAt: this.ctx.clock.now(),
        }),
      ]);
      await this.ctx.profiles.save(profile);
      return { client: profile, note };
    });
  }
}

export interface RemoveNoteInput {
  clientId: string;
  noteId: string;
}

export interface RemoveNoteOutput {
  client: ClientProfile;
}

export class RemoveNoteHandler {
  constructor(private readonly ctx: CrmCommandContext) {}

  async handle(input: RemoveNoteInput): Promise<RemoveNoteOutput> {
    return this.ctx.uow.run(async () => {
      const profile = await this.ctx.profiles.findById(input.clientId as never);
      if (!profile) throw new ClientProfileNotFoundError(input.clientId);

      const removed = profile.removeNote(input.noteId, this.ctx.clock);
      if (!removed) throw new NoteNotFoundError(input.noteId);
      await this.ctx.outbox.append([
        new NoteRemoved({
          clientId: profile.id,
          noteId: input.noteId,
          occurredAt: this.ctx.clock.now(),
        }),
      ]);
      await this.ctx.profiles.save(profile);
      return { client: profile };
    });
  }
}
