import '@fade/design-tokens/css';
import '@fade/design-tokens/fonts';
import './globals.css';
import type { Metadata } from 'next';
import AdminShell from './components/AdminShell';
import { OfflineProvider } from './components/OfflineResilienceProvider';

export const metadata: Metadata = {
  title: 'Barbershop Admin',
  description: 'Founder admin console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>
        <OfflineProvider>
          <AdminShell>{children}</AdminShell>
        </OfflineProvider>
      </body>
    </html>
  );
}
