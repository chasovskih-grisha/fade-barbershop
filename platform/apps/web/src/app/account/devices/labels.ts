import type { ClientSessionChannel } from '@fade/contracts';

export const CHANNEL_LABEL: Record<ClientSessionChannel, string> = {
  web: 'Вебсайт',
  mobile: 'Мобільний застосунок',
};

/** «Ще N» — лише для завантаженого списку, де є інші пристрої (T-4724). */
export function otherDevicesLabel(others: number | null): string | null {
  return others !== null && others > 0 ? `Ще ${others}` : null;
}
