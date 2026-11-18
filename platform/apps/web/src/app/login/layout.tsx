import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/metadata';

// Вхід — приватний сегмент: не індексуємо.

export const metadata: Metadata = pageMetadata({
  title: 'Вхід',
  description: 'Вхід у кабінет клієнта Fade за номером телефону.',
  path: '/login',
  noIndex: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
