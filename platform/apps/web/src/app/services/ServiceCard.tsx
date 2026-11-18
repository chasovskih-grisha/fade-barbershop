import Link from 'next/link';
import { Card } from '@fade/ui';
import type { Service } from '@/lib/api/catalog';

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Card className="flex flex-col justify-between p-7 transition-all duration-300 hover:border-accent hover:shadow-2xl border-line-strong/60 bg-surface group relative overflow-hidden">
      {/* Decorative ambient lighting glow */}
      <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-accent-blue/15 blur-2xl group-hover:bg-accent-blue/25 transition-all pointer-events-none" />

      <div className="flex flex-col gap-5 relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-caption font-bold uppercase text-accent-blue tracking-wider">
              ✦ Фірмовий ритуал FADE Atelier
            </span>
            <h2 className="text-h4 font-display font-bold text-fg group-hover:text-accent transition-colors mt-1">
              {service.name}
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-line-strong bg-surface-sunken px-3.5 py-1.5 text-caption font-semibold text-fg shadow-sm shrink-0">
            ⏱ {service.duration} хв
          </span>
        </div>

        {service.description && (
          <p className="text-body text-fg-secondary">{service.description}</p>
        )}

        <div className="rounded-[var(--radius-card)] bg-surface-sunken/80 border border-line p-4 text-caption text-fg-secondary space-y-2 backdrop-blur-sm">
          <div className="font-semibold text-fg uppercase tracking-wider text-[11px]">У вартість сеансу входять:</div>
          <div className="grid grid-cols-2 gap-1.5 text-fg-muted font-medium">
            <span>• Консультація стиліста</span>
            <span>• Миття та масаж голови</span>
            <span>• Гарячий компрес</span>
            <span>• Преміум стайлінг</span>
          </div>
        </div>

        <div className="mt-2 flex items-baseline justify-between pt-4 border-t border-line">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[2rem] font-bold text-fg leading-none">
              {service.price} ₴
            </span>
            <span className="text-caption text-fg-muted uppercase font-semibold">фіксована ціна</span>
          </div>
          <span className="text-caption font-semibold text-accent-blue bg-accent-blue/15 px-3.5 py-1 rounded-pill border border-accent-blue/30 shadow-sm">
            Запис за 60с
          </span>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3 pt-5 border-t border-line relative z-10">
        <Link
          href="/booking"
          className="inline-flex h-12 flex-1 items-center justify-center rounded-input bg-accent px-5 text-body font-semibold text-accent-fg hover:opacity-95 transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
        >
          Записатися
        </Link>
        <Link
          href={`/services/${service.id}`}
          className="inline-flex h-12 items-center justify-center rounded-input border border-line-strong px-5 text-body font-medium text-fg hover:bg-interactive hover:border-accent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
        >
          Деталі
        </Link>
      </div>
    </Card>
  );
}
