'use client';

import type { IconName } from '@fade/ui';

export interface SidebarNavItem {
  path: string;
  label: string;
  icon: IconName;
}

export const sidebarNavItems: SidebarNavItem[] = [
  { path: '/', label: 'Панель керування', icon: 'check' },
  { path: '/bookings/phone', label: 'Телефонні записи', icon: 'phone' },
  { path: '/visits', label: 'Візити', icon: 'user' },
  { path: '/clients', label: 'Клієнти', icon: 'user' },
  { path: '/services', label: 'Послуги', icon: 'scissors' },
  { path: '/barbers', label: 'Мастера', icon: 'user' },
  { path: '/locations', label: 'Локації', icon: 'map-pin' },
  { path: '/referrals', label: 'Реферали', icon: 'info' },
  { path: '/retention', label: 'Утримання (Win-Back)', icon: 'check' },
  { path: '/cash', label: 'Каса та розрахунки', icon: 'check' },
  { path: '/analytics', label: 'Аналітика', icon: 'info' },
  { path: '/blog', label: 'Блог', icon: 'info' },
  { path: '/settings/logins', label: 'Логіни', icon: 'mail' },
];
