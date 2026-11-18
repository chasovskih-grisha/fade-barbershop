'use client';

import Link from 'next/link';
import { Avatar, Icon } from '@fade/ui';
import { useAccountControl } from './useAccountControl';

// Контроль акаунта шапки (T-4715b): єдина клієнтська частина shell.
// Решта шапки лишається серверною. Поки сесія вантажиться — вигляд виходу,
// щоб не намалювати одного клієнта, а потім іншого (T-4715a).

const linkClass =
  'rounded-input p-2 text-fg-secondary transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue';

export function HeaderAccountLink() {
  const { href, ariaLabel, signedIn, name } = useAccountControl();

  return (
    <Link href={href} aria-label={ariaLabel} className={linkClass}>
      {signedIn ? (
        <Avatar {...(name ? { name } : {})} size="sm" aria-hidden />
      ) : (
        <Icon name="user" size={24} />
      )}
    </Link>
  );
}
