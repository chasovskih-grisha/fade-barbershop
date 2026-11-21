import Link from 'next/link';

export function CraftsmanshipConceptCard() {
  return (
    <div className="lg:col-span-6 relative">
      <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-sunken p-8 md:p-12 shadow-2xl flex flex-col justify-between aspect-[4/3] group">
        {/* Cinematic architectural watermark */}
        <div className="absolute right-4 bottom-4 text-[120px] font-display font-black text-fg/5 select-none pointer-events-none group-hover:text-accent-blue/10 transition-colors duration-700">
          FA
        </div>

        <div className="space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 px-3 py-1 text-caption font-semibold text-accent-blue border border-accent-blue/30">
            ✦ Концепція приватного простору
          </div>
          <h3 className="font-display text-h3 font-bold text-fg">ЖК «Сіті Лейк» • Центр Києва</h3>
          <p className="text-body text-fg-secondary">
            «Ти виходиш кращою версією себе — не іншою людиною.»
          </p>
        </div>

        <div className="relative z-10 pt-8 border-t border-line flex items-center justify-between text-body">
          <div>
            <span className="text-caption text-fg-muted block uppercase font-medium">
              Графік роботи
            </span>
            <span className="font-semibold text-fg">Щодня з 09:00 до 21:00</span>
          </div>
          <Link
            href="/locations"
            className="inline-flex items-center gap-1.5 font-semibold text-accent-blue hover:underline"
          >
            Усі адреси &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
