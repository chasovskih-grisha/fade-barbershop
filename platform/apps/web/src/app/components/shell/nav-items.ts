// Навігація публічного сайту — одне джерело для шапки, мобільного меню й футера
// (design-system.md §Shells: одна поверхня на роль). Специфікація — web-screens.md §0.

export interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Головна' },
  { href: '/locations', label: 'Локації' },
  { href: '/services', label: 'Послуги' },
  { href: '/barbers', label: 'Барбери' },
  { href: '/blog', label: 'Блог' },
];

/** CTA запису веде на `/booking` того самого сайту (web-screens §0, T-053). */
export const BOOKING_HREF = '/booking';
// Блок «Політика/Умови/Cookie» у футері з'явиться разом зі сторінками T-4402:
// доки їх немає, посилання в футері не рендеримо (краще порожній блок, ніж 404).
