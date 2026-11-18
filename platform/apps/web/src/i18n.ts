import { getRequestConfig } from 'next-intl/server';

export const locales = ['uk', 'en', 'es'] as const;
export const defaultLocale = 'uk';

export default getRequestConfig(async (params) => {
  const locale = params?.locale;
  const targetLocale = locale && locales.includes(locale as any) ? locale : defaultLocale;

  const domains = ['common', 'shell', 'locations', 'services', 'barbers', 'blog', 'booking', 'account', 'login', 'states', 'errors', 'shop'];
  const messages: Record<string, any> = {};
  for (const domain of domains) {
    try {
      messages[domain] = (await import(`../messages/${targetLocale}/${domain}.json`)).default;
    } catch {
      messages[domain] = (await import(`../messages/uk/${domain}.json`)).default;
    }
  }

  return {
    locale: targetLocale,
    messages
  };
});
