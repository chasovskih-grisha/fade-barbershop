import type { ClientSessionChannel } from '@fade/contracts';

const CHANNEL_LABEL: Record<ClientSessionChannel, string> = {
  web: 'Вебсайт',
  mobile: 'Мобільний застосунок',
};

/** Канал поточної сесії; null — список не завантажено або впав (T-4724). */
export function channelLabel(channel: ClientSessionChannel | null): string | null {
  return channel ? CHANNEL_LABEL[channel] : null;
}

/** «Ще N» — лише для завантаженого списку, де є інші пристрої (T-4724). */
export function otherDevicesLabel(others: number | null): string | null {
  return others !== null && others > 0 ? `Ще ${others}` : null;
}
