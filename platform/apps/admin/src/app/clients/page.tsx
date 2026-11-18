'use client';

// Список «Клієнти» (T-4606a/T-4606b, admin-screens §6.1): фільтр-бар → стрічка
// підсумків по фільтру → таблиця §6.1 → пагінація. Стан фільтрів, сортування,
// сторінки й періоду — у URL (useClientsList), без локального дубля.
// Стани T-4516: Skeleton; «Клієнтів ще немає»; «За фільтрами нічого не
// знайдено» + «Скинути фільтри»; помилка + «Спробувати ще раз».
import { useRouter } from 'next/navigation';
import { AlertBanner, Skeleton } from '@fade/ui';
import PageHeader from '../components/PageHeader';
import { ClientsFilters } from './ClientsFilters';
import { ClientsResults } from './ClientsResults';
import { ClientsSummary } from './ClientsSummary';
import { useClientsList } from './useClientsList';
import { useLocationOptions } from './useLocationOptions';

export default function ClientsPage() {
  const router = useRouter();
  const list = useClientsList();
  const locations = useLocationOptions();

  if (list.loading && !list.data && !list.error) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton variant="rect" className="h-10 w-72" />
        <Skeleton variant="rect" className="h-64" />
      </div>
    );
  }

  // Назви локацій для підсумків; невідомий id лишаємо як є — цифри важливіші.
  const locationName = (id: string) => locations.find((row) => row.id === id)?.name ?? id;

  return (
    <div>
      <PageHeader title="Клієнти" subtitle="Картки гостів, візити, лояльність і VIP-знижки" />
      {list.error && (
        <div className="mb-4">
          <AlertBanner
            tone="error"
            title="Список клієнтів"
            action={{ label: 'Спробувати ще раз', onClick: list.retry }}
          >
            {list.error}
          </AlertBanner>
        </div>
      )}
      <ClientsFilters list={list} />
      {list.summary && (
        <ClientsSummary
          summary={list.summary}
          period={list.period}
          onPeriod={list.setPeriod}
          locationName={locationName}
        />
      )}
      {!list.error && (
        <ClientsResults
          data={list.data}
          sort={list.sort}
          hasFilters={list.hasFilters}
          onSort={list.onSort}
          onPage={list.setPage}
          onReset={list.reset}
          onOpen={(id) => router.push(`/clients/${id}`)}
        />
      )}
    </div>
  );
}
