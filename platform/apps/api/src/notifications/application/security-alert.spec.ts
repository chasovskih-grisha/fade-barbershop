// NewDeviceAlert (T-4422): доставка сповіщення про новий вхід — email клієнта
// і/або push на ІНШІ пристрої. Текст називає канал і вихід «скрізь».
// Пропуски (ignored/duplicate/no-channel) — security-alert-skips.spec.ts.
import { NewDeviceAlert } from './security-alert';
import { OTHER_TOKEN, setup, startedEvent } from './security-alert.fakes';

describe('NewDeviceAlert: доставка', () => {
  it('лист на email клієнта: канал web і порада «вийти скрізь»', async () => {
    const { deps, sent, journalRows } = setup('client@example.com');

    const outcome = await new NewDeviceAlert(deps).handleOne(startedEvent('web'));

    expect(outcome).toEqual({ handled: true, reason: 'sent' });
    expect(sent[0]).toMatchObject({
      to: 'client@example.com',
      subject: expect.stringContaining('FADE'),
    });
    expect(sent[0]?.text).toContain('новий вхід');
    expect(sent[0]?.text).toContain('вебсайт');
    expect(sent[0]?.text).toContain('Вийти з усіх пристроїв');
    expect(sent[0]?.html).toContain('вебсайт');
    expect(sent[0]?.html).toContain('<!DOCTYPE html>');
    expect(sent[0]?.html).not.toContain('<script');
    expect(journalRows[0]).toMatchObject({
      eventId: 'evt-1',
      channel: 'email',
      recipient: 'client@example.com',
    });
  });

  it('mobile-вхід називає канал «мобільний застосунок»', async () => {
    const { deps, sent } = setup('client@example.com');

    await new NewDeviceAlert(deps).handleOne(startedEvent('mobile'));

    expect(sent[0]?.text).toContain('мобільний застосунок');
  });

  it('push іде лише на ІНШІ пристрої (exceptSessionId з події)', async () => {
    const { deps, pushed, journalRows } = setup(null, [OTHER_TOKEN]);

    const outcome = await new NewDeviceAlert(deps).handleOne(startedEvent('web'));

    expect(deps.devices.findOtherDeviceTokens).toHaveBeenCalledWith({
      userId: 'u-1',
      exceptSessionId: 's-new',
    });
    expect(outcome).toEqual({ handled: true, reason: 'sent' });
    expect(pushed[0]).toMatchObject({ token: OTHER_TOKEN });
    expect(pushed[0]?.body).toContain('вебсайт');
    expect(pushed[0]?.body).toContain('вийдіть з усіх пристроїв');
    expect(journalRows[0]).toMatchObject({ channel: 'push', recipient: '1 пристроїв' });
  });

  it('email і push разом — журнал фіксує обидва канали одним рядком', async () => {
    const { deps, sent, pushed, journalRows } = setup('client@example.com', [OTHER_TOKEN]);

    await new NewDeviceAlert(deps).handleOne(startedEvent());

    expect(sent).toHaveLength(1);
    expect(pushed).toHaveLength(1);
    expect(journalRows[0]).toMatchObject({
      channel: 'email+push',
      recipient: 'client@example.com',
    });
    expect(deps.journal.markSent).toHaveBeenCalledTimes(1);
  });
});
