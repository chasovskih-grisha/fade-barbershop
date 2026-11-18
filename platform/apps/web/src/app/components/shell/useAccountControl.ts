'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/components/auth/AuthProvider';
import { accountHref } from './account-href';

// Спільний стан контролю акаунта шапки (T-4715a): призначення й видиме слово
// однакові на десктопі та в мобільному меню. Поки сесія вантажиться — вигляд
// виходу, щоб не намалювати одного клієнта, а потім іншого.

export interface AccountControl {
  href: string;
  /** Видиме слово для мобільного рядка. */
  label: string;
  /** Доступне ім'я посилання. */
  ariaLabel: string;
  signedIn: boolean;
  name: string;
}

export function useAccountControl(): AccountControl {
  const { user } = useAuth();
  const pathname = usePathname();
  const name = user?.name?.trim() ?? '';

  if (user) {
    return {
      href: '/account',
      label: name ? `Кабінет, ${name}` : 'Кабінет',
      ariaLabel: name ? `Кабінет, ${name}` : 'Кабінет',
      signedIn: true,
      name,
    };
  }

  return {
    href: accountHref(pathname),
    label: 'Увійти',
    ariaLabel: 'Увійти',
    signedIn: false,
    name: '',
  };
}
