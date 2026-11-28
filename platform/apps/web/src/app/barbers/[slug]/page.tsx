import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBarberBySlug } from '@/lib/api/staff';
import { getServices } from '@/lib/api/catalog';
import { pageMetadata } from '@/lib/metadata';
import { BarberDetailContent } from './BarberDetailContent';
import { BarberInactive } from './BarberInactive';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getBarberBySlug(slug);
  // Вимкнений майстер існує, але не приймає записів — у пошук не потрапляє (T-4865a).
  if (result.state !== 'ok' || !result.data.active) {
    return pageMetadata({
      title: 'Майстер не знайдений',
      path: `/barbers/${slug}`,
      noIndex: true,
    });
  }
  return pageMetadata({
    title: `${result.data.name} — майстер барбершопу Fade`,
    description: `Майстер ${result.data.name}: досвід, послуги, ціни та вільні вікна на запис.`,
    path: `/barbers/${slug}`,
  });
}

export default async function BarberDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  // Послуги з цінами локації (T-4477a) вантажаться паралельно з профілем:
  // збій каталогу не робить сторінку майстра порожньою (T-4860).
  const [result, services] = await Promise.all([
    getBarberBySlug(resolvedParams.slug),
    getServices(),
  ]);

  if (result.state !== 'ok') {
    notFound();
  }

  if (!result.data.active) return <BarberInactive name={result.data.name} />;

  return <BarberDetailContent barber={result.data} services={services} />;
}
