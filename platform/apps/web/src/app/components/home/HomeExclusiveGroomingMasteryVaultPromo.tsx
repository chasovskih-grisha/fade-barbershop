import Link from 'next/link';
import { Card } from '@fade/ui';

export function HomeExclusiveGroomingMasteryVaultPromo() {
  return (
    <section
      aria-labelledby="exclusive-grooming-vault-title"
      className="relative overflow-hidden rounded-[var(--radius-card)] border-2 border-accent-blue/40 bg-surface p-8 md:p-12 shadow-2xl"
    >
      {/* Decorative background ambient glow */}
      <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-accent-blue/15 blur-3xl pointer-events-none" />
      <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-4 py-1.5 text-caption font-semibold uppercase text-accent-blue tracking-wider w-fit shadow-sm">
            ✦ Ексклюзивний приватний випуск • Fall 2026
          </div>
          <h2
            id="exclusive-grooming-vault-title"
            className="font-display text-[2.25rem] md:text-[3rem] font-bold text-fg leading-tight"
          >
            Vault of Grooming Mastery &amp; Bespoke Care
          </h2>
          <p className="max-w-2xl text-bodyLg text-fg-secondary">
            Отримайте персональний доступ до закритої колекції професійного догляду та преміальних
            ритуалів Fade. Зберігайте бездоганну форму щодня з ексклюзивними формулами центру Києва.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-surface-sunken/80 border-line-strong/60 backdrop-blur-md flex flex-col gap-3 shadow-md">
            <span className="text-caption font-bold text-accent-blue uppercase tracking-wider">
              01 / Екстракт Бороди
            </span>
            <h3 className="text-h5 font-display font-semibold text-fg">Argan &amp; Cedar Elixir</h3>
            <p className="text-body text-fg-secondary">
              Живлення шкіри обличчя та пом&rsquo;якшення жорсткого волосся з перших секунд
              нанесення.
            </p>
          </Card>
          <Card className="p-6 bg-surface-sunken/80 border-line-strong/60 backdrop-blur-md flex flex-col gap-3 shadow-md">
            <span className="text-caption font-bold text-accent-blue uppercase tracking-wider">
              02 / Геометрія &amp; Фіксація
            </span>
            <h3 className="text-h5 font-display font-semibold text-fg">Matte Clay Sculptor</h3>
            <p className="text-body text-fg-secondary">
              Матовий фініш без обтяження та жирного блиску з тривалою стійкістю до 24 годин.
            </p>
          </Card>
          <Card className="p-6 bg-surface-sunken/80 border-line-strong/60 backdrop-blur-md flex flex-col gap-3 shadow-md">
            <span className="text-caption font-bold text-accent-blue uppercase tracking-wider">
              03 / Фірмовий Ритуал
            </span>
            <h3 className="text-h5 font-display font-semibold text-fg">Hot Towel Infusion</h3>
            <p className="text-body text-fg-secondary">
              Класичний компрес на ефірних оліях чайного дерева для повного розслаблення.
            </p>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-line">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <span className="text-body font-semibold text-fg">
              Спеціальна пропозиція для членів клубу
            </span>
            <span className="text-caption text-fg-secondary">
              При записі цього тижня — знижка 15% на комплект догляду в студії
            </span>
          </div>
          <Link
            href="/booking"
            className="inline-flex h-13 items-center justify-center rounded-input bg-accent px-8 text-body font-semibold text-accent-fg hover:opacity-95 transition-all shadow-lg hover:scale-[1.02]"
          >
            Забронювати сеанс &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
