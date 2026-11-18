import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/metadata';

// Флоу запису — приватний сегмент (обрізається в CRM, не в індексі).

export const metadata: Metadata = pageMetadata({
  title: 'Запис',
  description: 'Онлайн-запис у барбершоп Fade.',
  path: '/booking',
  noIndex: true,
});

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
