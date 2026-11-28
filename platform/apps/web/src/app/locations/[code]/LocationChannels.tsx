import type { Channel } from '@/lib/api/locations';
import { channelLabel, channelHref, channelDisplay } from './channel-format';

// Контакти студії (T-4833a): телефон — окремий контрол у рядку дій
// (LocationPhoneLink), тут лише решта каналів як ряд іменованих контролів.

const NEW_TAB: Channel['channel'][] = ['website', 'facebook'];

export default function LocationChannels({ channels }: { channels: Channel[] }) {
  const others = channels
    .filter((channel) => channel.channel !== 'phone')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (others.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-h4">Контакти</h2>
      <ul className="flex flex-wrap gap-1">
        {others.map((channel) => (
          <li key={channel.channel}>
            <a
              href={channelHref(channel)}
              aria-label={`${channelLabel(channel.channel)}: ${channelDisplay(channel)}`}
              target={NEW_TAB.includes(channel.channel) ? '_blank' : undefined}
              rel={NEW_TAB.includes(channel.channel) ? 'noreferrer' : undefined}
              className="inline-flex h-12 items-center rounded-input px-3 text-body text-fg underline decoration-fg-secondary underline-offset-4 hover:decoration-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            >
              {channelLabel(channel.channel)}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
