import { FadeEmblem } from './FadeEmblem';

export function HomeBrandStory() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface-sunken border border-line-strong p-8 md:p-20 shadow-2xl">
      {/* Cinematic ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-blue/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-surface/80 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 flex flex-col items-start gap-6">
          <div className="inline-flex items-center gap-3">
            <FadeEmblem className="w-10 h-10 text-accent-blue" />
            <span className="text-caption font-bold uppercase tracking-wider text-accent-blue">
              Маніфест бренду FADE
            </span>
          </div>

          <h2 className="font-display text-[2.25rem] md:text-h2 font-bold text-fg leading-tight">
            Ніякого конвеєра. <br />
            <span className="fade-gradient-text">Тільки чиста форма і спокій.</span>
          </h2>

          <p className="text-bodyLg text-fg-secondary">
            У світі швидкого фастфуду та галасливих барбершопів з чергами, FADE пропонує інший
            досвід. Це камерна студія на два крісла у центрі Києва, де кожен гість отримує повну
            увагу майстра, бездоганний сервіс та розкіш тиші.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-line">
            <div>
              <div className="text-h3 font-display font-bold text-fg">0 компромісів</div>
              <div className="text-caption text-fg-muted uppercase font-medium mt-1">
                Преміальна косметика
              </div>
            </div>
            <div>
              <div className="text-h3 font-display font-bold text-fg">2 крісла</div>
              <div className="text-caption text-fg-muted uppercase font-medium mt-1">
                Приватна атмосфера
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-8 rounded-[var(--radius-card)] bg-surface border border-line flex flex-col justify-between gap-6 shadow-xl relative group hover:border-accent transition-colors">
            <div className="absolute top-6 right-6 text-accent-blue/20 group-hover:text-accent-blue/40 transition-colors">
              <span className="font-display text-4xl font-bold">01</span>
            </div>
            <div className="space-y-3 relative z-10">
              <span className="text-caption font-semibold uppercase text-accent-blue tracking-wider">
                Анатомічна точність
              </span>
              <h3 className="font-display text-h4 font-bold text-fg">Геометрія під ваш стиль</h3>
              <p className="text-body text-fg-secondary">
                Ми враховуємо структуру черепа, щільність волосся та індивідуальні особливості,
                створюючи форму, яка ідеально тримається тижнями.
              </p>
            </div>
            <div className="pt-4 border-t border-line text-caption font-semibold text-fg flex items-center justify-between">
              <span>Авторська техніка</span>
              <span className="text-accent-blue">&rarr;</span>
            </div>
          </div>

          <div className="p-8 rounded-[var(--radius-card)] bg-surface border border-line flex flex-col justify-between gap-6 shadow-xl relative group hover:border-accent transition-colors">
            <div className="absolute top-6 right-6 text-accent-blue/20 group-hover:text-accent-blue/40 transition-colors">
              <span className="font-display text-4xl font-bold">02</span>
            </div>
            <div className="space-y-3 relative z-10">
              <span className="text-caption font-semibold uppercase text-accent-blue tracking-wider">
                Ритуали догляду
              </span>
              <h3 className="font-display text-h4 font-bold text-fg">Гарячий рушник та бритва</h3>
              <p className="text-body text-fg-secondary">
                Кожна стрижка чи гоління супроводжується фірмовим гарячим компресом з аромаоліями,
                масажем голови та професійним стайлінгом.
              </p>
            </div>
            <div className="pt-4 border-t border-line text-caption font-semibold text-fg flex items-center justify-between">
              <span>Повний релакс</span>
              <span className="text-accent-blue">&rarr;</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
