// Специфікація use cases crm (юніт-рівень піраміди: команди з фейками портів,
// без БД). Транзакція — passthrough; події перехоплює in-memory outbox.
import { UpdateClientProfileHandler, AddNoteHandler, RemoveNoteHandler } from './crm-handlers';
import { ClientProfileNotFoundError, NoteNotFoundError } from './crm-errors';
import { crmHandlersSetup } from './crm-handlers-setup';

describe('CRM use cases', () => {
  it('оновлення профілю змінює імʼя і телефон; невідомий клієнт — помилка', async () => {
    const { ctx } = crmHandlersSetup();
    await new UpdateClientProfileHandler(ctx).handle({
      clientId: 'p-1',
      name: 'Новий',
      phone: '+380672222222',
    });
    expect(ctx.profiles.findById('p-1' as never).then((p) => [p?.name, p?.phone])).resolves.toEqual(
      ['Новий', '+380672222222']
    );
    await expect(
      new UpdateClientProfileHandler(ctx).handle({ clientId: 'nope' })
    ).rejects.toBeInstanceOf(ClientProfileNotFoundError);
  });

  it('нотатка додається з подією crm.note.added; видалення чужої — NoteNotFoundError', async () => {
    const { ctx, events } = crmHandlersSetup();
    const out = await new AddNoteHandler(ctx).handle({
      clientId: 'p-1',
      text: 'любить еспресо',
      authorId: 'b-1',
      authorRole: 'barber',
    });
    expect(out.note).toMatchObject({
      text: 'любить еспресо',
      authorRole: 'barber',
      visibleToClient: false,
    });
    expect(events.map((e) => e.type)).toContain('crm.note.added');
    await expect(
      new RemoveNoteHandler(ctx).handle({ clientId: 'p-1', noteId: 'missing' })
    ).rejects.toBeInstanceOf(NoteNotFoundError);
  });
});
