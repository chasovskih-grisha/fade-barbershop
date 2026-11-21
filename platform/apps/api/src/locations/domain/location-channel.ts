// Канал зв'язку локації (MNG-ADM-01: телефон/email; розширення — месенджери
// і соцмережі). Value-логіка без стану: нормалізація + валідація значення
// за типом. Один канал на тип (унікальність — і в домені, і в БД).

export const CHANNEL_TYPES = [
  'phone',
  'email',
  'viber',
  'telegram',
  'instagram',
  'facebook',
  'whatsapp',
  'website',
] as const;

export type ChannelType = (typeof CHANNEL_TYPES)[number];

export interface ChannelData {
  channel: ChannelType;
  value: string;
  sortOrder: number;
}

export const CHANNEL_LIMIT = 10;

const PHONE_RE = /^\+?.[0-9\s()-]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HANDLE_RE = /^[A-Za-z0-9_.]{3,32}$/;
const SITE_RE = /^https?:\/\/\S{1,500}$/;

/** Нормалізує і валідує канал; кидає Error з людиною-зрозумілим повідомленням. */
export function normalizeChannel(
  channel: string,
  rawValue: string,
  sortOrder: number
): ChannelData {
  const type = channel as ChannelType;
  if (!(CHANNEL_TYPES as readonly string[]).includes(channel)) {
    throw new Error(`Unknown channel type: ${channel}`);
  }
  const value = rawValue.trim();
  if (value.length === 0 || value.length > 200) {
    throw new Error('Channel value must be 1–200 characters');
  }
  return { channel: type, value: normalizeByType(type, value), sortOrder };
}

/** Нормалізація значення за типом каналу (тип гарантовано в CHANNEL_TYPES). */
function normalizeByType(type: ChannelType, value: string): string {
  switch (type) {
    case 'phone':
    case 'viber':
    case 'whatsapp':
      return validated(value, PHONE_RE, 'Invalid phone number');
    case 'email':
      return validated(value, EMAIL_RE, 'Invalid email');
    case 'telegram':
    case 'instagram': {
      // @handle зберігаємо без собачки; показ — відповідальність UI.
      const handle = value.replace(/^@/, '');
      return validated(handle, HANDLE_RE, 'Invalid handle (3–32: letters, digits, _ .)');
    }
    case 'facebook': {
      const path = value.replace(/^https?:\/\/(www\.)?facebook\.com\//, '');
      return validated(path, HANDLE_RE, 'Invalid Facebook page');
    }
    default:
      return validated(value, SITE_RE, 'Website must be an http(s) URL');
  }
}

function validated(value: string, re: RegExp, message: string): string {
  if (!re.test(value)) throw new Error(message);
  return value;
}

/** Будує список каналів: валідація кожного, без дублікатів типів, ліміт. */
export function normalizeChannels(
  inputs: readonly { channel: string; value: string; sortOrder?: number }[]
): ChannelData[] {
  if (inputs.length > CHANNEL_LIMIT) throw new Error(`At most ${CHANNEL_LIMIT} channels`);
  const seen = new Set<string>();
  return inputs.map((input, index) => {
    const normalized = normalizeChannel(input.channel, input.value, input.sortOrder ?? index);
    if (seen.has(normalized.channel)) throw new Error(`Duplicate channel: ${normalized.channel}`);
    seen.add(normalized.channel);
    return normalized;
  });
}
