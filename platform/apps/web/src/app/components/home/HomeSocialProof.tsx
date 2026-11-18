import React from 'react';
import { Card } from '@fade/ui';

export function HomeSocialProof() {
  return (
    <section className="flex flex-col gap-8 rounded-[var(--radius-card)] bg-surface border border-line p-8 md:p-12 shadow-md">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/10 px-3 py-1 text-caption font-semibold uppercase tracking-wider text-accent-blue w-fit">
            <span>⭐️ Соціальний доказ та довіра</span>
          </div>
          <h2 className="text-h3 font-display font-semibold text-fg">
            Вибір понад 1,400 чоловіків, які цінують свій час і стиль
          </h2>
          <p className="text-body text-fg-secondary">
            Ми не женемося за кількістю крісел. Наші студії створені для комфорту, конфіденційності та ідеальної точності стрижки.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 shrink-0 sm:flex sm:flex-row">
          <div className="flex flex-col items-center sm:items-start p-4 rounded-input bg-surface-sunken border border-line">
            <span className="text-h4 font-display font-bold text-fg">4.98 / 5.0</span>
            <span className="text-caption text-fg-secondary">Google & App рейтинг</span>
          </div>
          <div className="flex flex-col items-center sm:items-start p-4 rounded-input bg-surface-sunken border border-line">
            <span className="text-h4 font-display font-bold text-fg">94%</span>
            <span className="text-caption text-fg-secondary">Постійні гості</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col justify-between p-6 bg-surface-sunken border border-line gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex text-fg text-sm">★★★★★</div>
            <p className="text-body text-fg italic">
              &ldquo;Неймовірна атмосфера приватного клубу. Ніяких черг і галасу. Майстер одразу зрозумів ідею стрижки.&rdquo;
            </p>
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-line/50">
            <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center font-display font-semibold text-accent-blue">
              МК
            </div>
            <div>
              <div className="text-body font-semibold text-fg">Максим Коваленко</div>
              <div className="text-caption text-fg-secondary">Гість студії з 2024 року</div>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-6 bg-surface-sunken border border-line gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex text-fg text-sm">★★★★★</div>
            <p className="text-body text-fg italic">
              &ldquo;Найкращий fade у місті. Тримається форму понад 3 тижні бездоганно. Дуже зручний онлайн-запис за 1 хвилину.&rdquo;
            </p>
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-line/50">
            <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center font-display font-semibold text-accent-blue">
              ДШ
            </div>
            <div>
              <div className="text-body font-semibold text-fg">Денис Шевченко</div>
              <div className="text-caption text-fg-secondary">Підприємець, постійний клієнт</div>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-6 bg-surface-sunken border border-line gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex text-fg text-sm">★★★★★</div>
            <p className="text-body text-fg italic">
              &ldquo;Сервіс рівня топ-готелів: смачна кава, спокійна музика та професійний підхід до кожної деталі.&rdquo;
            </p>
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-line/50">
            <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center font-display font-semibold text-accent-blue">
              ОР
            </div>
            <div>
              <div className="text-body font-semibold text-fg">Олександр Романенко</div>
              <div className="text-caption text-fg-secondary">IT-консультант</div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
