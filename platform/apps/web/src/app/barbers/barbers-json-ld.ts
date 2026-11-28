// T-4851: пункт JSON-LD для картки майстра складається лише з полів запису.
// Раніше сторінка писала `jobTitle: role || 'Майстер-барбер'`, тож людина без
// ролі отримувала посаду, якої їй ніхто не давав — та сама вигадана обіцянка,
// яку картка вже не робить. Порожня або пробільна роль — це відсутня роль.

/** Поля запису, які справді потрапляють у структуровані дані картки. */
export interface BarberJsonLdSource {
  name: string;
  slug: string;
  role?: string | null | undefined;
  photoUrl?: string | null | undefined;
}

export interface BarberJsonLdPerson {
  '@type': 'Person';
  name: string;
  jobTitle?: string;
  url: string;
  image?: string;
  worksFor: { '@type': 'HairSalon'; name: string; url: string };
}

export interface BarbersJsonLd {
  '@context': 'https://schema.org';
  '@type': 'ItemList';
  itemListElement: Array<{ '@type': 'ListItem'; position: number; item: BarberJsonLdPerson }>;
}

const fact = (value: string | null | undefined): string => (value ?? '').trim();

const salon = (siteUrl: string): BarberJsonLdPerson['worksFor'] => ({
  '@type': 'HairSalon',
  name: 'FADE Barbershop',
  url: siteUrl,
});

/** `ItemList` для довідника: одна позиція на картку, без вигаданих фактів. */
export function barbersJsonLd(barbers: BarberJsonLdSource[], siteUrl: string): BarbersJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: barbers.map((barber, index) => {
      const role = fact(barber.role);
      const person: BarberJsonLdPerson = {
        '@type': 'Person',
        name: barber.name,
        url: `${siteUrl}/barbers/${barber.slug}`,
        ...(barber.photoUrl ? { image: barber.photoUrl } : {}),
        worksFor: salon(siteUrl),
      };
      // Роль є в записі — є посада; немає ролі — немає поля.
      if (role) person.jobTitle = role;
      return { '@type': 'ListItem', position: index + 1, item: person };
    }),
  };
}
