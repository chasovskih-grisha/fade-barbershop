// Підписи доменних полей деталей візиту: fallback «саме як у API» для
// значень, яких немає у словнику (щоб нові коди не губилися в «—»).

export const SOURCE_LABELS: Record<string, string> = {
  web: 'Сайт',
  admin: 'Адмінка',
  phone: 'Телефонний запис',
  telegram: 'Telegram',
  walk_in: 'З живої черги',
};

export const FULFILLMENT_LABELS: Record<string, string> = {
  sequential: 'Послідовно',
  parallel: 'Паралельно',
};

export const PARTY_ROLE_LABELS: Record<string, string> = {
  guest: 'Гість',
  father: 'Батько',
  son: 'Син',
  companion: 'Компаньйон',
};

export const EVENT_STATUS_LABELS: Record<string, string> = {
  pending: 'У черзі',
  published: 'Опубліковано',
  failed: 'Помилка',
};

export const NOTIFICATION_STATUS_LABELS: Record<string, string> = {
  pending: 'У черзі',
  sent: 'Надіслано',
  failed: 'Помилка',
};
