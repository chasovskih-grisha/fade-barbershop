import '@fade/design-tokens/css';
import '@fade/design-tokens/fonts';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import tokens from '@fade/design-tokens/tokens.json';
import { PublicShell } from './components/shell/PublicShell';
import { AuthProvider } from './components/auth/AuthProvider';
import { RumReporter } from './components/RumReporter';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { ConversionIntelligenceTracker } from './components/ConversionIntelligenceTracker';
import { PwaRegistrar } from './components/PwaRegistrar';

// Кореневий layout публічного сайту (T-4508): спільний shell + SEO-шаблон сторінок.
// Метадані сторінок перевизначають `title`/`description` через pageMetadata (lib/metadata).

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: 'Fade — барбершоп у Києві, запис онлайн',
    template: '%s · Fade',
  },
  description: 'Мережа барбершопів: запис за 10 секунд, ціни й вільні вікна онлайн.',
  applicationName: 'Fade',
  formatDetection: { telephone: false },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Fade',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  // Колір береться з токену, а не з літерала (гейт «тільки токени»).
  themeColor: tokens.color.surface.base.value,
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <RumReporter />
          <AnalyticsTracker />
          <ConversionIntelligenceTracker />
          <PwaRegistrar />
          <AuthProvider>
            <PublicShell>{children}</PublicShell>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
