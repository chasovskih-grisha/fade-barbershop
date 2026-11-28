import { Card } from '@fade/ui';
import type { Service } from '@/lib/api/catalog';
import type { LoadableList } from '@/lib/api/loadable';

// Послуги майстра з цінами локації (T-4477a, PRT-WEB-02), у порядку регіонів
// T-4860. Ціна — з ServicePrice саме цієї локації; клієнтські знижки на
// публічній сторінці не показуються (ADR 0010). Немає ціни — «уточнюється»,
// а не вигадане число; немає каталогу — чесний стан без вигаданих назв.
export function BarberServices({ services }: { services: LoadableList<Service> }) {
  const list = services.state === 'ok' ? services.data : [];
  const failure = services.state === 'error' ? services.message : null;

  return (
    <Card className="p-5 flex flex-col gap-3">
      <h3 className="font-display text-h4 font-semibold">Послуги та ціни</h3>
      {failure && <p className="text-caption text-fg-secondary">{failure}</p>}
      {!failure && list.length === 0 && (
        <p className="text-caption text-fg-secondary">
          Перелік послуг з&apos;явиться, щойно локація його опублікує.
        </p>
      )}
      {list.length > 0 && (
        <ul className="flex flex-col gap-2">
          {list.map((service) => (
            <li
              key={service.id}
              className="flex items-baseline justify-between gap-4 border-b border-line pb-2 last:border-b-0 last:pb-0"
            >
              <span className="text-body text-fg">{service.name}</span>
              <span className="shrink-0 text-body font-semibold text-fg">
                {service.price > 0 ? `${service.price} ₴` : 'Ціна уточнюється'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
