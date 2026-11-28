import { Button } from '../Button';
import { Card } from '../Card';

const LOCATION = 'Київ, вул. Антоновича 12';

const SERVICES = [
  { name: 'Стрижка', price: '600 ₴' },
  { name: 'Гоління', price: '400 ₴' },
  { name: 'Борода', price: '250 ₴' },
];

/** Мобільна головна: локація, список послуг і закріплений CTA. */
export function MobileHomePreview() {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 rounded-card border border-line bg-surface-base p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-caption uppercase tracking-wider text-fg-muted">Локація</span>
          <span className="text-body text-fg">{LOCATION}</span>
        </div>
        <Button size="sm" variant="ghost">
          Змінити
        </Button>
      </div>

      <ul aria-label="Послуги поруч" className="flex list-none flex-col gap-2">
        {SERVICES.map((service) => (
          <li key={service.name}>
            <Card padding="sm" className="flex items-center justify-between gap-3">
              <span className="text-body text-fg">{service.name}</span>
              <span className="text-body tabular-nums text-fg-secondary">{service.price}</span>
            </Card>
          </li>
        ))}
      </ul>

      <Button size="lg" className="w-full">
        Записатися
      </Button>
    </div>
  );
}
