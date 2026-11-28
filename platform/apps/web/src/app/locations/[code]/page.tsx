import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocationByCode, type Location } from '@/lib/api/locations';
import { pageMetadata } from '@/lib/metadata';
import { ErrorState } from '@/app/components/states/ErrorState';
import { LocationDetail } from './LocationDetail';
import { LocationInactive } from './LocationInactive';

// T-4821a: місто в structured data — це `addressParts.city`, а не «Київ» за
// замовчуванням. Немає міста — немає ключа `addressLocality`.
function postalAddress(location: Location) {
  const city = location.addressParts?.city?.trim();
  return {
    '@type': 'PostalAddress',
    streetAddress: location.address,
    ...(city ? { addressLocality: city } : {}),
    addressCountry: 'UA',
  };
}

// Детальна сторінка локації — /locations/{code} (web-screens §2). Сторінка
// лише вибирає стан (T-4513): помилка API → AlertBanner + «Спробувати ще раз»
// (сторінка лишається живою), невідомий код → 404, вимкнена локація → явний
// стан «не приймає записів» з CTA (замість 404: гість приходить за посиланням).

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const result = await getLocationByCode(code);
  // Вимкнена локація існує, але не приймає записів — у пошук не потрапляє.
  if (result.state !== 'ok' || !result.data.active) {
    return pageMetadata({
      title: 'Локація не знайдена',
      path: `/locations/${code}`,
      noIndex: true,
    });
  }
  // T-4841: прев'ю посилання — фото студії, а не дефолт сайту. Перше за
  // sortOrder, як у галереї; без фото тег не вигадується.
  const cover = [...result.data.photos].sort((a, b) => a.sortOrder - b.sortOrder)[0];
  return pageMetadata({
    title: `${result.data.name} — адреса, години, запис`,
    description: `Барбершоп ${result.data.name}: ${result.data.address}. Години роботи, контакти й онлайн-запис.`,
    path: `/locations/${code}`,
    ...(cover ? { image: cover.url } : {}),
  });
}

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const result = await getLocationByCode(code);
  if (result.state === 'notFound') notFound();

  if (result.state === 'error') {
    return (
      <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-10 md:py-16">
        <h1 className="font-display text-h2">Локація</h1>
        <ErrorState message={result.message} />
      </div>
    );
  }

  if (!result.data.active) return <LocationInactive name={result.data.name} />;

  const location = result.data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fade.com.ua';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    name: `FADE Barbershop — ${location.name}`,
    description: `Барбершоп ${location.name} за адресою ${location.address}. Години роботи, контакти та онлайн-запис.`,
    url: `${siteUrl}/locations/${location.code}`,
    telephone: location.phone ?? undefined,
    email: location.email ?? undefined,
    image: location.photos?.[0]?.url ?? location.logo?.lightUrl ?? undefined,
    logo: location.logo?.lightUrl ?? undefined,
    address: postalAddress(location),
    geo: {
      '@type': 'GeoCoordinates',
      latitude: location.lat,
      longitude: location.lng,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LocationDetail location={location} />
    </>
  );
}
