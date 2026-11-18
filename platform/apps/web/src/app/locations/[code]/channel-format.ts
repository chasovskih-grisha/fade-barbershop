// Форматування контактів локації для детальної сторінки (web-screens §2):
// підпис каналу, href (tel:/mailto:/https:) і нормалізоване відображення.

import type { Channel } from '@/lib/api/locations';

const LABELS: Record<Channel['channel'], string> = {
  phone: 'Телефон',
  email: 'Email',
  viber: 'Viber',
  telegram: 'Telegram',
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  website: 'Сайт',
};

export function channelLabel(channel: Channel['channel']): string {
  return LABELS[channel];
}

export function channelHref(channel: Channel): string {
  switch (channel.channel) {
    case 'phone':
    case 'viber':
    case 'whatsapp':
      return `tel:${channel.value.replace(/[\s()-]/g, '')}`;
    case 'email':
      return `mailto:${channel.value}`;
    case 'telegram':
      return `https://t.me/${channel.value}`;
    case 'instagram':
      return `https://instagram.com/${channel.value}`;
    case 'facebook':
      return channel.value.startsWith('http')
        ? channel.value
        : `https://facebook.com/${channel.value}`;
    case 'website':
      return channel.value;
  }
}

export function channelDisplay(channel: Channel): string {
  return channel.channel === 'phone' ||
    channel.channel === 'viber' ||
    channel.channel === 'whatsapp'
    ? channel.value
    : `@${channel.value}`;
}
