import React from 'react';
import { AccountShell } from './components/AccountShell';

// Кабінет клієнта — приватний сегмент: не індексуємо (сторінка за авторизацією).
// Guard по авторизації — у клієнтському AccountShell, тут лише метадані й каркас.

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
