// Вирішення каналу доставки (виділено зі споживача за LOC-гейтом):
// налаштування none → свідома вимкнена доставка; вибраний канал без
// одержувача → skip із причиною для журналу.
import type { ConfirmationChannel } from '../domain/booking-confirmation-settings';

/** Результат вирішення каналу для події. */
export type ChannelDecision =
  | { kind: 'disabled' }
  | { kind: 'deliver'; channel: Exclude<ConfirmationChannel, 'none'> }
  | { kind: 'skip'; channel: Exclude<ConfirmationChannel, 'none'>; detail: string };

export function decideChannel(channel: ConfirmationChannel): ChannelDecision {
  if (channel === 'none') return { kind: 'disabled' };
  return { kind: 'deliver', channel };
}

/** Причина skip: одержувача вибраного каналу не існує. */
export function missingRecipientDetail(
  channel: Exclude<ConfirmationChannel, 'none'>,
  locationId: string
): string {
  return `немає одержувача (${channel}) для локації ${locationId}`;
}
