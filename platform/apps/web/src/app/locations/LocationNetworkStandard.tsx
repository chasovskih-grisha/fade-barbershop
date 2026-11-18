import { Card } from '@fade/ui';
import { ActionLink } from '@/app/components/ActionLink';

const POINTS = [
  {
    title: 'Індивідуальний підхід',
    body: 'Персональний майстер враховує особливості вашого стилю та форми обличчя.',
  },
  {
    title: 'Преміальна косметика',
    body: 'Використовуємо елітні бренди догляду за бородою та волоссям.',
  },
  {
    title: 'Бездоганний сервіс',
    body: 'Напої з барної карти, комфортна атмосфера та абсолютна конфіденційність.',
  },
];

/** Network promise on the locations listing. Night system: surface, line, no glow. */
export function LocationNetworkStandard() {
  return (
    <Card className="flex flex-col gap-6 rounded-card border border-line bg-surface p-8 md:p-10">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="flex max-w-2xl flex-col gap-2">
          <span className="text-caption font-bold uppercase text-accent">Стандарт мережі FADE</span>
          <h3 className="font-display text-h3 font-bold text-fg">Чому обирають наші студії?</h3>
          <p className="text-body leading-relaxed text-fg-secondary">
            Ми повністю відмовилися від формату шумних барбершопів-фабрик. Кожна студія Fade — це
            простір виняткової естетики, де час належить тільки вам.
          </p>
        </div>
        <ActionLink href="/booking" className="h-14 shrink-0 px-8 text-bodyLg font-bold">
          Забронювати час у студії &rarr;
        </ActionLink>
      </div>
      <div className="grid grid-cols-1 gap-6 border-t border-line pt-6 sm:grid-cols-3">
        {POINTS.map((point) => (
          <div key={point.title} className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2 text-sm font-bold text-fg">
              <span className="text-accent">✦</span> {point.title}
            </span>
            <span className="text-caption text-fg-secondary">{point.body}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
