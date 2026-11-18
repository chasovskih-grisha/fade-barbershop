import { FadeEmblem } from './FadeEmblem';

export function FadeVisualComposition() {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface border border-line-strong p-8 md:p-16 shadow-2xl group">
      {/* Cinematic background lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-blue/15 rounded-full blur-3xl pointer-events-none group-hover:bg-accent-blue/25 transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-surface-sunken rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-4.5 py-2 text-caption font-semibold uppercase tracking-wider text-accent-blue shadow-sm w-fit">
            ✦ Флагманський простір • Київ
          </div>

          <h2 className="font-display text-[2.5rem] md:text-h1 font-bold text-fg leading-[1.05]">
            Форма контролю. <br />
            <span className="fade-gradient-text drop-shadow-md">
              Мистецтво чистих ліній.
            </span>
          </h2>

          <p className="text-bodyLg text-fg-secondary max-w-xl">
            Кожна стрижка у FADE — це архітектурний витвір. Жодних компромісів із випадковими трендами. Лише ідеальна пропорція під ваш череп, вивірений кут бритви та бездоганний спокій.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-line/90">
            <div className="p-5 rounded-[var(--radius-card)] bg-surface-sunken/90 border border-line backdrop-blur-md shadow-md">
              <div className="font-display text-h3 font-bold text-fg">01</div>
              <div className="text-caption text-fg-muted uppercase font-semibold mt-1">Анатомічний розрахунок</div>
            </div>
            <div className="p-5 rounded-[var(--radius-card)] bg-surface-sunken/90 border border-line backdrop-blur-md shadow-md">
              <div className="font-display text-h3 font-bold text-fg">02</div>
              <div className="text-caption text-fg-muted uppercase font-semibold mt-1">Гарячий компрес</div>
            </div>
            <div className="p-5 rounded-[var(--radius-card)] bg-surface-sunken/90 border border-line backdrop-blur-md shadow-md col-span-2 sm:col-span-1">
              <div className="font-display text-h3 font-bold text-fg">03</div>
              <div className="text-caption text-fg-muted uppercase font-semibold mt-1">Преміум стайлінг</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative flex items-center justify-center">
          <div className="w-full max-w-md aspect-square rounded-[var(--radius-card)] bg-surface-sunken border border-line-strong p-8 md:p-10 shadow-2xl flex flex-col items-center justify-between relative overflow-hidden group-hover:border-accent transition-all duration-500">
            <div className="absolute -right-20 -top-20 w-56 h-56 bg-accent-blue/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-full flex items-center justify-between text-caption text-fg-muted uppercase font-bold">
              <span>EST. 2026</span>
              <span>ATELIER CLT-01</span>
            </div>

            <div className="py-6 flex flex-col items-center gap-5 relative z-10">
              <FadeEmblem className="w-32 h-32 text-accent-blue drop-shadow-2xl group-hover:scale-105 transition-transform duration-500" />
              <div className="text-center space-y-1.5">
                <h3 className="font-display text-h4 font-bold text-fg">FADE ATELIER</h3>
                <p className="text-caption text-fg-secondary">Київ • ЖК «Сіті Лейк»</p>
              </div>
            </div>

            <div className="w-full pt-4 border-t border-line text-center text-caption text-fg-secondary italic font-medium">
              «Ти виходиш кращою версією себе»
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

