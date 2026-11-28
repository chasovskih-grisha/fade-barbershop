import { AlertBanner } from '@fade/ui';
import { ActionLink } from '@/app/components/ActionLink';

// Вимкнений майстер за прямим URL (T-4865a): не 404, а пояснення + вихід.
// Посилання з пошуку чи старого листа ще живе, тож гість має побачити, що
// запис до цієї людини недоступний, і куди йти далі. Сторінка поза індексом.

export function BarberInactive({ name }: { name: string }) {
  return (
    <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-10 md:py-16">
      <h1 className="font-display text-h2">{name}</h1>
      <AlertBanner
        tone="info"
        title="Цей майстер тимчасово не приймає записів"
        description="Адміністратор вимкнув його профіль, тож вільні вікна тут не показуються. Оберіть іншого майстра — решта команди працює як завжди."
      >
        <div className="mt-2 flex flex-wrap gap-3">
          <ActionLink href="/barbers" variant="secondary">
            Обрати іншого майстра
          </ActionLink>
        </div>
      </AlertBanner>
    </div>
  );
}
