import type { Service } from '@/lib/api/catalog';

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface ServiceReview {
  author: string;
  datePublished: string;
  reviewRating: { ratingValue: string; bestRating: string };
  reviewBody: string;
}

/** FAQ copy for the service detail page. */
export function buildServiceFaqs(service: Service): ServiceFaq[] {
  return [
    {
      question: `Скільки триває процедура ${service.name}?`,
      answer: `${service.name} у барбершопі FADE триває приблизно ${service.duration} хвилин.`,
    },
    {
      question: 'Чи потрібен попередній запис?',
      answer:
        'Так, ми рекомендуємо записуватися заздалегідь онлайн через сайт або мобільний додаток FADE.',
    },
  ];
}

/** Sample reviews used in the page's structured data and visible list. */
export function buildServiceReviews(service: Service): ServiceReview[] {
  return [
    {
      author: 'Максим К.',
      datePublished: '2026-10-15',
      reviewRating: { ratingValue: '5', bestRating: '5' },
      reviewBody: `Неймовірна якість послуги ${service.name}. Професійний підхід та бездоганний результат.`,
    },
    {
      author: 'Андрій Т.',
      datePublished: '2026-10-20',
      reviewRating: { ratingValue: '5', bestRating: '5' },
      reviewBody: 'Найкращий барбершоп у місті. Атмосфера та сервіс на найвищому рівні.',
    },
  ];
}
