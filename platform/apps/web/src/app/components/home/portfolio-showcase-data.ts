export interface PortfolioShowcaseItem {
  title: string;
  barber: string;
  category: string;
  imageGradient: string;
  tag: string;
  description: string;
}

export const PORTFOLIO_SHOWCASE_ITEMS: PortfolioShowcaseItem[] = [
  {
    title: 'High Skin Fade & Texture Crop',
    barber: 'Денис',
    category: 'Стрижка & Текстура',
    imageGradient: 'from-accent-blue/20 via-surface-raised to-surface-sunken',
    tag: 'Бестселер',
    description: 'Ідеальна геометрія плавного переходу з текстурним макулатурним кропом.',
  },
  {
    title: 'Executive Beard Sculpting & Hot Towel',
    barber: 'Артем',
    category: 'Борода & Ритуал',
    imageGradient: 'from-accent/20 via-surface-raised to-surface-sunken',
    tag: 'Преміум догляд',
    description: 'Моделювання контурів бороди з ритуалом гарячого компресу та олійками.',
  },
  {
    title: 'Classic Taper Fade & Pompadour Styling',
    barber: 'Денис',
    category: 'Класика',
    imageGradient: 'from-accent-blue/15 via-surface-raised to-surface-sunken',
    tag: 'Фірмовий стиль',
    description: 'Витончений тейпер-фейд у поєднанні з класичним обʼємним стайлінгом.',
  },
  {
    title: 'Royal Hot Towel Shave & Royal Ritual',
    barber: 'Артем',
    category: 'Королівське гоління',
    imageGradient: 'from-accent/25 via-surface-raised to-surface-sunken',
    tag: 'Ексклюзив',
    description: 'Традиційне гоління небезпечною бритвою з ароматерапією та масажем обличчя.',
  },
];
