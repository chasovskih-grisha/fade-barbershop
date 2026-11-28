import type { Channel } from '@/lib/api/locations';
import { channelHref } from './channel-format';

// Телефон студії — один button-sized контрол у рядку дій (T-4833a).
// Канал phone переважає над location.phone: два номери не показуємо двічі.

function phoneTarget(phone: string | null, channels: Channel[]): Channel | null {
  const channel = channels.find((item) => item.channel === 'phone');
  if (channel) return channel;
  return phone ? { channel: 'phone', value: phone, sortOrder: 0 } : null;
}

export function LocationPhoneLink({
  phone,
  channels,
}: {
  phone: string | null;
  channels: Channel[];
}) {
  const target = phoneTarget(phone, channels);
  if (!target) return null;
  return (
    <a
      href={channelHref(target)}
      aria-label={`Зателефонувати: ${target.value}`}
      className="inline-flex h-12 items-center justify-center rounded-input border border-line px-5 font-text text-bodyLg font-medium text-fg transition-colors hover:bg-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
    >
      {target.value}
    </a>
  );
}
