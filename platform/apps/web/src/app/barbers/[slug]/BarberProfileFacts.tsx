import { Card } from '@fade/ui';
import type { Barber } from '@/lib/api/staff';

// Профіль майстра показує лише те, що справді є (T-4477a): без вигаданої
// біографії, досвіду чи спеціалізацій «для всіх однаково». Немає даних —
// немає блоку, і це валідна сторінка.
export function BarberProfileFacts({ barber }: { barber: Barber }) {
  const hasExperience = Boolean(barber.experience);
  const specialties = barber.specialties ?? [];

  if (!hasExperience && specialties.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {hasExperience && (
          <Card className="p-4 flex flex-col gap-1">
            <span className="text-xs text-fg-secondary">Досвід роботи</span>
            <span className="font-display text-bodyLg font-semibold">{barber.experience}</span>
            <span className="text-xs text-fg-muted">Сотні задоволених гостей</span>
          </Card>
        )}
        {specialties.length > 0 && (
          <Card className="p-4 flex flex-col gap-1">
            <span className="text-xs text-fg-secondary">Спеціалізація</span>
            <span className="font-display text-bodyLg font-semibold">
              {specialties.slice(0, 2).join(' & ')}
            </span>
            <span className="text-xs text-fg-muted">Індивідуальний підбір форми</span>
          </Card>
        )}
      </div>

      {specialties.length > 0 && (
        <Card className="p-5 flex flex-col gap-3">
          <h3 className="font-display text-h4 font-semibold">Спеціалізації та навички</h3>
          <div className="flex flex-wrap gap-2 pt-1">
            {specialties.map((spec) => (
              <span
                key={spec}
                className="rounded-md bg-surface-sunken border border-line px-3 py-1 text-caption text-fg font-medium"
              >
                {spec}
              </span>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
