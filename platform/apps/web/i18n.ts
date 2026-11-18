import { getRequestConfig } from 'next-intl/server';
import { routing } from './src/routing';

export default getRequestConfig(async ({ locale }) => {
  // Ensure that a valid locale is used
  let activeLocale = locale;
  if (!activeLocale || !routing.locales.includes(activeLocale as any)) {
    activeLocale = routing.defaultLocale;
  }

  return {
    locale: activeLocale,
    messages: (await import(`./messages/${activeLocale}.json`)).default,
  };
});
