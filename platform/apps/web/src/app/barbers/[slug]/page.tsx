import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBarberBySlug } from '@/lib/api/staff';
import { pageMetadata } from '@/lib/metadata';
import { BarberDetailContent } from './BarberDetailContent';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getBarberBySlug(slug);
  if (result.state !== 'ok') {
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
  const result = await getBarberBySlug(resolvedParams.slug);

  if (result.state !== 'ok') {
    notFound();
  }

  return <BarberDetailContent barber={result.data} />;
}
