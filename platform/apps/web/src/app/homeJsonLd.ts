/** Structured data for the landing page (local business + top FAQs). */
export function buildHomeJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fade.com.ua';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BarberShop',
        name: 'FADE Barbershop',
        description:
          'Мережа приватних барбершопів Fade у Києві. Точність форми, спокій і якість поруч із домом.',
        url: siteUrl,
        telephone: '+380443343333',
        priceRange: '$$',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'вул. Велика Васильківська, 72',
          addressLocality: 'Київ',
          addressCountry: 'UA',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 50.4375,
          longitude: 30.5175,
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: [
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday',
            ],
            opens: '09:00',
            closes: '21:00',
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Як записатися на стрижку?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Запис займає до 60 секунд. Оберіть послугу, майстра, зручний час та підтвердіть телефон через SMS (OTP). Без створення складних паролів.',
            },
          },
          {
            '@type': 'Question',
            name: 'Чи є знижка для нового гостя?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Так, на перший візит діє спеціальна знижка -100 ₴ на будь-яку стрижку в мережі FADE.',
            },
          },
        ],
      },
    ],
  };
}
