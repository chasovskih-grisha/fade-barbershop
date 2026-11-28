import { Button } from '../Button';
import { Card } from '../Card';
import { StatusPill } from '../StatusPill';

const SERVICES = [
  { name: 'Стрижка', duration: '45 хв', price: '600 ₴' },
  { name: 'Гоління', duration: '30 хв', price: '400 ₴' },
  { name: 'Борода', duration: '20 хв', price: '250 ₴' },
];

const NAV = ['Послуги', 'Барбери', 'Локації', 'Контакти'];

/** Головна сторінка web: hero, три послуги і вхід у флоу запису. */
export function WebHomePreview() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-bodyLg font-semibold tracking-widest text-fg">FADE</span>
        <nav aria-label="Головна навігація" className="hidden gap-4 sm:flex">
          {NAV.map((item) => (
            <span key={item} className="text-sm text-fg-secondary">
              {item}
            </span>
          ))}
        </nav>
        <Button size="sm" variant="secondary">
          Записатися
        </Button>
      </header>

      <div className="flex flex-col gap-3">
        <h1 className="text-h2 text-fg">Стрижка поруч із домом</h1>
        <p className="max-w-prose text-body text-fg-secondary">
          Обери послугу, барбера і час — підтвердження приходить одразу.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Обрати час</Button>
          <StatusPill status="confirmed" label="Слоти на сьогодні є" />
        </div>
      </div>

      <ul
        aria-label="Послуги"
        data-testid="web-home-services"
        className="grid list-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {SERVICES.map((service) => (
          <li key={service.name}>
            <Card padding="md" className="flex h-full flex-col gap-1">
              <span className="text-body font-medium text-fg">{service.name}</span>
              <span className="text-sm text-fg-muted">{service.duration}</span>
              <span className="text-body tabular-nums text-fg">{service.price}</span>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
