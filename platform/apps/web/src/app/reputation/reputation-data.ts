export type ReputationTab = 'benchmarks' | 'reviews' | 'competitive' | 'topics';

export interface DistrictBenchmark {
  district: string;
  fadeRating: number;
  marketAverage: number;
  reviewsCount: number;
  sentimentScore: string;
  badge: string;
}

export interface VerifiedReview {
  id: string;
  author: string;
  service: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
}

export const DISTRICT_BENCHMARKS: DistrictBenchmark[] = [
  {
    district: 'Печерськ (Флагман)',
    fadeRating: 4.98,
    marketAverage: 4.62,
    reviewsCount: 1420,
    sentimentScore: '99% Positive',
    badge: 'Лідер району 🥇',
  },
  {
    district: 'Поділ',
    fadeRating: 4.95,
    marketAverage: 4.58,
    reviewsCount: 980,
    sentimentScore: '98% Positive',
    badge: 'Топ-рейтинг 🌟',
  },
  {
    district: 'Шевченківський',
    fadeRating: 4.97,
    marketAverage: 4.6,
    reviewsCount: 1150,
    sentimentScore: '99% Positive',
    badge: 'Еталон якості ✨',
  },
  {
    district: 'Оболонь',
    fadeRating: 4.94,
    marketAverage: 4.55,
    reviewsCount: 840,
    sentimentScore: '97% Positive',
    badge: 'Вибір гостей 🏆',
  },
];

export const RECENT_VERIFIED_REVIEWS: VerifiedReview[] = [
  {
    id: '1',
    author: 'Олександр М.',
    service: 'Стрижка + Небезпечне бритвество',
    rating: 5,
    date: 'Вчора, студія на Печерську',
    text: 'Неймовірний рівень сервісу та уваги до деталей. Майстер Андрій врахував усі побажання щодо геометрії та форми.',
    verified: true,
  },
  {
    id: '2',
    author: 'Дмитро К.',
    service: 'Моделювання бороди & Hot Towel',
    rating: 5,
    date: ' 2 дні тому, студія на Подолі',
    text: 'Фірмовий ритуал гарячого рушника та догляд за бородою — найкращі в Києві. Атмосфера та кава на висоті.',
    verified: true,
  },
  {
    id: '3',
    author: 'Максим В.',
    service: 'Комплекс "Батько + Син"',
    rating: 5,
    date: '3 дні тому, Шевченківський',
    text: 'Ходимо разом із сином уже пів року. Завжди бездоганно, швидко та у надзвичайно затишній атмосфері.',
    verified: true,
  },
];
