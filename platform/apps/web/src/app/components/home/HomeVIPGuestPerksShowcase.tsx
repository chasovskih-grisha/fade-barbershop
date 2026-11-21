import Link from 'next/link';
import { Card } from '@fade/ui';

export function HomeVIPGuestPerksShowcase() {
  return (
    <Card className="p-8 md:p-12 flex flex-col gap-8 border-accent/40 bg-gradient-to-br from-surface-raised via-surface to-surface-sunken relative overflow-hidden shadow-2xl rounded-[var(--radius-card)]">
      {/* Ambient background glow */}
      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-accent-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -top-20 w-80 h-80 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 border-b border-line pb-6">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-4 py-1.5 text-caption font-semibold uppercase text-accent-blue tracking-wider w-fit">
            ✦ Ексклюзивний статус FADE VIP
          </div>
          <h3 className="font-display text-h3 md:text-h2 font-bold text-fg leading-tight">
            Привілеї високого рівня для кожного гостя
          </h3>
          <p className="text-bodyLg text-fg-secondary">
            Ми створили атмосферу абсолютного комфорту, де кожна деталь працює на ваш бездоганний
            імідж, розслаблення та економію часу.
          </p>
        </div>
        <Link
          href="/booking"
          className="inline-flex h-13 items-center justify-center rounded-input bg-accent px-8 text-body font-semibold text-accent-fg hover:opacity-95 w-fit shrink-0 transition-all shadow-lg hover:scale-[1.02]"
        >
          Записатися з вигодою &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="flex flex-col gap-3 p-6 rounded-card bg-surface-raised border border-line shadow-sm hover:border-accent/40 transition-all group">
          <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent font-display font-bold text-h4 group-hover:scale-110 transition-transform">
            01
          </div>
          <h4 className="font-display text-h4 font-bold text-fg">Персональний ритуал</h4>
          <p className="text-body text-fg-secondary leading-relaxed">
            Індивідуальний підбір косметики, консультація стиліста та фірмовий гарячий рушник з
            ароматерапією у кожному візиті.
          </p>
        </div>

        <div className="flex flex-col gap-3 p-6 rounded-card bg-surface-raised border border-line shadow-sm hover:border-accent/40 transition-all group">
          <div className="w-12 h-12 rounded-full bg-accent-blue/15 flex items-center justify-center text-accent-blue font-display font-bold text-h4 group-hover:scale-110 transition-transform">
            02
          </div>
          <h4 className="font-display text-h4 font-bold text-fg">Накопичувальний кешбек</h4>
          <p className="text-body text-fg-secondary leading-relaxed">
            Повертайте до 10% від вартості кожної послуги на свій баланс у додатку Fade для оплати
            майбутніх візитів та доглядової косметики.
          </p>
        </div>

        <div className="flex flex-col gap-3 p-6 rounded-card bg-surface-raised border border-line shadow-sm hover:border-accent/40 transition-all group">
          <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent font-display font-bold text-h4 group-hover:scale-110 transition-transform">
            03
          </div>
          <h4 className="font-display text-h4 font-bold text-fg">Гарантія якості Fade</h4>
          <p className="text-body text-fg-secondary leading-relaxed">
            Якщо зачіска потребує легкого корегування протягом тижня, ми проведемо його абсолютно
            безкоштовно у будь-якій студії мережі.
          </p>
        </div>
      </div>
    </Card>
  );
}
