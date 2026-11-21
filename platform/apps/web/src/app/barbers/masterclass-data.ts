export interface Masterclass {
  id: number;
  title: string;
  instructor: string;
  level: string;
  duration: string;
  price: string;
  description: string;
  highlights: string[];
}

export const MASTERCLASSES: Masterclass[] = [
  {
    id: 1,
    title: 'Master Fade & Skin-Fade Geometry',
    instructor: 'Олександр "FadeMaster" К.',
    level: 'Просунутий / Для майстрів та ентузіастів',
    duration: '3 години (Індивідуальний практичний сеанс)',
    price: '3,800 ₴',
    description:
      'Поглиблений майстер-клас з ідеальної градуйованої розтушовки “під нуль”, роботи з різними типами черепа та текстурування макушки.',
    highlights: [
      'Аналіз пропорцій та геометрії обличчя',
      'Техніки роботи безпечною бритвою та шейвером',
      'Секрети довговічності та чистоти переходу',
    ],
  },
  {
    id: 2,
    title: 'Sculpting Beard & Hot Towel Ritual',
    instructor: 'Максим "BeardCraft" В.',
    level: 'Базовий та середній',
    duration: '2.5 години',
    price: '3,200 ₴',
    description:
      'Мистецтво моделювання бороди за золотим перетином, техніки гарячого рушника та правильного догляду за преміум-косметикою Fade.',
    highlights: [
      'Моделювання симетрії бороди та вусів',
      'Королівське гоління з гарячим компресом',
      'Добірка індивідуального домашнього догляду',
    ],
  },
  {
    id: 3,
    title: 'Executive VIP Styling & Grooming',
    instructor: 'Дмитро "Executive" С.',
    level: 'VIP / Персональний імідж-консалтинг',
    duration: '4 години (Повний день трансформації)',
    price: '6,500 ₴',
    description:
      'Ексклюзивний сеанс для бізнес-лідерів та публічних персон. Підбір зачіски та бороди під гардероб і статусний стиль.',
    highlights: [
      'Повний комплекс преміум-стрижки та догляду',
      'Консультація стиліста щодо іміджу та гардеробу',
      'VIP-карта Fade на 15% знижки на весь рік',
    ],
  },
];
