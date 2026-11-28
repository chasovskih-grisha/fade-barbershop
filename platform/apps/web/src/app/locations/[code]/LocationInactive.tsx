import { AlertBanner } from '@fade/ui';
import { ActionLink } from '@/app/components/ActionLink';

// Вимкнена локація за прямим URL (T-4513): не 404, а пояснення + вихід.
// Гість приходить за посиланням із пошуку або старого листа — треба сказати,
// що запис недоступний, і показати, куди йти далі. Сторінка лишається
// поза індексом (robots noIndex у generateMetadata).

export function LocationInactive({ name }: { name: string }) {
  return (
    <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-10 md:py-16">
      <h1 className="font-display text-h2">{name}</h1>
      <AlertBanner
        tone="info"
        title="Ця локація тимчасово не приймає записів"
        description="Адміністратор вимкнув її, тож вікна запису тут не показуються. Скористайтеся іншою локацією — вони працюють як завжди."
      >
        <div className="mt-2 flex flex-wrap gap-3">
          <ActionLink href="/locations" variant="secondary">
            Обрати іншу локацію
          </ActionLink>
        </div>
      </AlertBanner>
    </div>
  );
}
