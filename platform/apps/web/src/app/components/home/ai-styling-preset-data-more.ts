import type { Recommendation } from './ai-styling-types';

export const HEART_PRESETS: Recommendation[] = [
  {
    id: 'textured-fringe',
    name: 'Soft Fringe & Balanced Beard',
    subtitle: 'Збалансовує вузький підборіддя',
    description:
      'Мʼяка текстурна стрижка з акцентом на середню довжину та густу бороду для повноти.',
    matchScore: 95,
    price: 700,
    duration: 50,
    recommendedBarber: 'Артем Шевченко (Top Stylist)',
    benefits: [
      'Гармонізація пропорцій',
      'Природна рухливість волосся',
      'Комплексний догляд за бородою',
    ],
  },
];

export const DIAMOND_PRESETS: Recommendation[] = [
  {
    id: 'side-sweep-fade',
    name: 'Side Swept Undercut & Taper',
    subtitle: 'Помʼякшує вилиці та додає балансу',
    description: 'Асиметричний напрямок пасм з акуратним звуженням на потилиці та скронях.',
    matchScore: 97,
    price: 650,
    duration: 45,
    recommendedBarber: 'Денис Коваленко (Fade Specialist)',
    benefits: [
      'Маскування широких вилиць',
      'Стильний асиметричний акцент',
      'Легкість трансформації у класику',
    ],
  },
];
