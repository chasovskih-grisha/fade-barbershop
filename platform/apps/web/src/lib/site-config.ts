// Контакти для футера. Значення — конфігураційні змінні (ADR 0017: домени й контакти
// в коді не літерали). Порожнє поле = секція не рендериться (web-screens: сайт не
// показує пусток), тому дефолтів «на око» тут немає.

import type { IconName } from "@fade/ui/dist/icons";

export interface SiteContact {
  label: string;
  value: string;
  href: string;
  icon: 'phone' | 'mail' | 'map-pin';
}

export interface SiteSocial {
  label: string;
  href: string;
  icon: IconName;
}

const read = (key: string) => process.env[key]?.trim() || undefined;

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export function siteContacts(): SiteContact[] {
  const contacts: SiteContact[] = [];
  const phone = read('NEXT_PUBLIC_CONTACT_PHONE');
  if (phone) contacts.push({ label: 'Телефон', value: phone, href: telHref(phone), icon: 'phone' });
  const email = read('NEXT_PUBLIC_CONTACT_EMAIL');
  if (email) contacts.push({ label: 'Email', value: email, href: `mailto:${email}`, icon: 'mail' });
  const address = read('NEXT_PUBLIC_CONTACT_ADDRESS');
  if (address) contacts.push({ label: 'Адреса', value: address, href: '', icon: 'map-pin' });
  return contacts;
}

const SOCIAL_ENV: { env: string; label: string; icon: IconName }[] = [
  { env: 'NEXT_PUBLIC_SOCIAL_INSTAGRAM', label: 'Instagram', icon: 'instagram' },
  { env: 'NEXT_PUBLIC_SOCIAL_TELEGRAM', label: 'Telegram', icon: 'telegram' },
  { env: 'NEXT_PUBLIC_SOCIAL_VIBER', label: 'Viber', icon: 'viber' },
];

/** Канали локації в соцмережах (LocationChannel, web-screens §2) — лише задані в env. */
export function siteSocials(): SiteSocial[] {
  return SOCIAL_ENV.flatMap(({ env, label, icon }) => {
    const href = read(env);
    return href ? [{ label, href, icon }] : [];
  });
}
