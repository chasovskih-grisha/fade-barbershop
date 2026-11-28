import { Share } from 'react-native';

// T-4862b: поширення профілю майстра з застосунку. Адреса — публічна сторінка
// сайту, тож посилання відкривається в будь-якого отримувача.
const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://fade.com.ua';

export function barberProfileUrl(slug: string): string {
  return `${SITE_URL.replace(/\/$/, '')}/barbers/${encodeURIComponent(slug)}`;
}

export async function shareBarberProfile(name: string, slug: string): Promise<void> {
  const url = barberProfileUrl(slug);
  await Share.share({ title: name, message: `${name} — Fade\n${url}`, url });
}
