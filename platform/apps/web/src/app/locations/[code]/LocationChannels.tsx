import type { Channel } from '@/lib/api/locations';
import { channelLabel, channelHref, channelDisplay } from './channel-format';

// Контакти локації (web-screens §2): телефон клікабельний + решта каналів
// (viber/telegram/instagram/…). Канал phone з профілю дублюється першим.

export default function LocationChannels({ channels }: { channels: Channel[] }) {
  if (channels.length === 0) return null;
  const sorted = [...channels].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <section aria-label="Контакти" className="flex flex-col gap-2">
      <h2 className="font-display text-h4">Контакти</h2>
      <ul className="flex flex-col gap-1">
        {sorted.map((channel) => (
          <li key={channel.channel}>
            <a
              href={channelHref(channel)}
              target={
                channel.channel === 'website' || channel.channel === 'facebook'
                  ? '_blank'
                  : undefined
              }
              rel={
                channel.channel === 'website' || channel.channel === 'facebook'
                  ? 'noreferrer'
                  : undefined
              }
              className="text-body text-fg underline decoration-fg-secondary underline-offset-4 hover:decoration-fg"
            >
              <span className="text-fg-secondary">{channelLabel(channel.channel)}: </span>
              {channelDisplay(channel)}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
