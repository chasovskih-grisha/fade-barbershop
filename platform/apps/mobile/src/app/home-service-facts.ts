// T-4849: на головній під списком студій не стоїть одна ціна. Ціна належить
// студії (ADR 0006) і показується на її екрані (T-4837b); головна лишає лише
// факти каталогу — назву послуги і тривалість.
import type { ServiceDto } from '../lib/api/catalog';

export interface HomeServiceFact {
  id: string;
  title: string;
  duration: string;
}

/** Рядок послуги на головній: назва і тривалість, без грошей. */
export function homeServiceFact(
  service: Pick<ServiceDto, 'id' | 'name' | 'durationMinutes'>
): HomeServiceFact {
  return {
    id: service.id,
    title: service.name,
    duration: `${service.durationMinutes} хв`,
  };
}
