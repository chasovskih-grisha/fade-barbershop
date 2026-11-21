export interface StyleItem {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  badge?: string;
  benefits: string[];
}

export const STYLES: StyleItem[] = [
  {
    id: 'fade-classic',
    name: 'Преміальний Традиційний Fade + Beard Sculpt',
    description:
      'Бездоганна геометрія переходу під ваш череп, моделювання бороди гарячим рушником та преміальна косметика.',
    duration: '60 хв',
    price: '950 ₴',
    badge: 'Топ вибір гостів',
    benefits: ['Консультація стиліста', 'Миття голови до та після', 'Укладання преміум-стайлінгом'],
  },
  {
    id: 'executive-cut',
    name: 'Executive Gentleman Cut',
    description:
      'Класична стрижка з ретельною текстурою ножицями, миття голови автентичним релакс-масажем та фінішний стайлінг.',
    duration: '45 хв',
    price: '750 ₴',
    benefits: [
      'Індивідуальний підбір форми',
      'Скронева корекція бритвою',
      'Ароматерапевтичний компрес',
    ],
  },
  {
    id: 'royal-shave',
    name: 'Royal Hot Towel Shave & Spa',
    description:
      'Королівське гоління небезпечною бритвою з трьома гарячими та холодними компресами, олійкою та бальзамом.',
    duration: '45 хв',
    price: '650 ₴',
    badge: 'Релакс & Догляд',
    benefits: [
      'Підготовка шкіри олійкою',
      'Миттєве заспокоєння',
      'Ексклюзивний парфумований післяголив',
    ],
  },
];
