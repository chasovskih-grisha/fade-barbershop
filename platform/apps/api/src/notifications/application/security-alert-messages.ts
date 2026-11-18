// Тексти сповіщення про новий вхід (T-4422) — окремо від security-alert.ts
// за LOC-гейтом: одна подія, два канали (email і push), той самий зміст.
// Лист рендериться з templates/security-alert. Push лишається коротким текстом.

import { renderEmailTemplate } from '../infrastructure/liquid-email-renderer';
import { formatWhen } from './letter-fields';

const PUSH_TITLE = 'FADE: новий вхід';
const PUSH_BODY = 'Якщо це не ви — вийдіть з усіх пристроїв у кабінеті.';

export function alertSubject(): string {
  return renderEmailTemplate('security-alert', 'subject', { brand: 'FADE' });
}

/** Канал людиною: mobile — «мобільний застосунок», решта — «вебсайт». */
function channelName(channel: string): string {
  return channel === 'mobile' ? 'мобільний застосунок' : 'вебсайт';
}

function view(channel: string): Record<string, unknown> {
  return {
    brand: 'FADE',
    when: formatWhen(new Date().toISOString()),
    channelName: channelName(channel),
  };
}

export function emailText(event: { payload: { channel: string } }): string {
  return renderEmailTemplate('security-alert', 'text', view(event.payload.channel));
}

export function emailHtml(event: { payload: { channel: string } }): string {
  return renderEmailTemplate('security-alert', 'html', view(event.payload.channel));
}

export function pushBody(event: { payload: { channel: string } }): string {
  return `${channelName(event.payload.channel)}. ${PUSH_BODY}`;
}

export { PUSH_TITLE };
