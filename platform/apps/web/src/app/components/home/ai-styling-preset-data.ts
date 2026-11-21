import type { Recommendation } from './ai-styling-types';

export const OVAL_PRESETS: Recommendation[] = [
  {
    id: 'crop-textured',
    name: 'Modern Textured Crop & Low Fade',
    subtitle: 'Ідеально підкреслює пропорції овального обличчя',
    description: 'Текстурний верх з акцентом на природний обʼєм та плавний перехід на скронях.',
    matchScore: 98,
    price: 650,
    duration: 45,
    recommendedBarber: 'Максим Воронов (Master Barber)',
    benefits: [
      'Не потребує складної щоденної укладки',
      'Візуально збалансовані лінії',
      'Свіжий та сучасний вигляд',
    ],
  },
  {
    id: 'executive-pompadour',
    name: 'Executive Pompadour & Beard Trim',
    subtitle: 'Класика з сучасним шармом',
    description: 'Елегантна зачесана назад форма з чистими контурами та доглянутою бородою.',
    matchScore: 94,
    price: 950,
    duration: 60,
    recommendedBarber: 'Артем Шевченко (Top Stylist)',
    benefits: [
      'Бездоганний діловий стиль',
      'Включає ритуал гарячого рушника',
      'Преміальні стайлінг-продукти',
    ],
  },
];

export const SQUARE_PRESETS: Recommendation[] = [
  {
    id: 'skin-fade-sharp',
    name: 'High Skin Fade & Hard Part',
    subtitle: 'Підкреслює сильну лінію щелепи',
    description: 'Високий контрастний перехід з чітко виділеним проділом та графітовим контуром.',
    matchScore: 99,
    price: 600,
    duration: 45,
    recommendedBarber: 'Денис Коваленко (Fade Specialist)',
    benefits: [
      'Максимально мускулистої форми',
      'Ідеальні кути та геометрія',
      'Стійкість форми до 3 тижнів',
    ],
  },
];

export const ROUND_PRESETS: Recommendation[] = [
  {
    id: 'volume-top-fade',
    name: 'High Volume Quiff & Mid Fade',
    subtitle: 'Візуально витягує форму обличчя',
    description: 'Акцент на обʼєм у верхній частині з короткими скронями для гармонійного силуету.',
    matchScore: 96,
    price: 650,
    duration: 45,
    recommendedBarber: 'Максим Воронов (Master Barber)',
    benefits: [
      'Візуально стрункіший силует',
      'Легкий контроль обʼєму',
      'Чудово пасує під щоденний кежуал',
    ],
  },
];
