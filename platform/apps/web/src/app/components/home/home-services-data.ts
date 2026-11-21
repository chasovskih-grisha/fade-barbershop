export interface ServiceHighlight {
  duration: string;
  title: string;
  price: string;
  description: string;
  cta: string;
  featured?: boolean;
}

export const SERVICE_HIGHLIGHTS: ServiceHighlight[] = [
  {
    duration: '50 хв • Стрижка',
    title: 'Чоловіча стрижка',
    price: '700 ₴',
    description:
      'Індивідуальна консультація стиліста, професійне миття, точна геометрія форми та гарячий компрес.',
    cta: 'Записатися онлайн',
  },
  {
    duration: '75 хв • Повний ритуал',
    title: 'Комплекс FADE',
    price: '1 000 ₴',
    description:
      'Ідеальний дует преміум-рівня: чоловіча стрижка + моделювання та догляд бороди з гарячим рушником.',
    cta: 'Обрати комплекс →',
    featured: true,
  },
  {
    duration: '30 хв • Догляд',
    title: 'Стрижка бороди',
    price: '450 ₴',
    description:
      'Моделювання чітких симетричних контурів, професійна корекція бритвою та поживні олії.',
    cta: 'Записатися',
  },
];
