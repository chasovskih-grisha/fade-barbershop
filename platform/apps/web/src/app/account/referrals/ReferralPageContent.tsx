'use client';

import { AlertBanner, Button, Card, Badge, Skeleton } from '@fade/ui';
import { useReferralPage } from './useReferralPage';

const STATUS_LABEL: Record<'pending' | 'rewarded', { label: string; tone: 'warning' | 'success' }> = {
  pending: { label: 'Очікує візиту друга', tone: 'warning' },
  rewarded: { label: 'Бонус нараховано (+150 ₴)', tone: 'success' },
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium' }).format(new Date(iso));
}

export function ReferralPageContent() {
  const page = useReferralPage();

  if (page.error) {
    return (
      <AlertBanner
        tone="error"
        title="Помилка"
        action={{ label: 'Спробувати ще раз', onClick: () => void page.retry() }}
      >
        {page.error}
      </AlertBanner>
    );
  }

  if (page.loading || !page.data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton variant="rect" className="h-32" />
        <Skeleton variant="rect" className="h-48" />
      </div>
    );
  }

  const { data } = page;
  const remainingSlots = Math.max(0, data.monthlyLimit - data.monthlyUsed);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-h3">Реферальна програма</h1>
        <p className="text-body-s text-fg-secondary">
          Запрошуйте друзів до FADE: друг отримує знижку на перший візит, а ви — 150 бонусних гривень після його завершення.
        </p>
      </header>

      {page.shareError ? (
        <AlertBanner tone="error" title="Увага">
          {page.shareError}
        </AlertBanner>
      ) : null}

      {/* Код та посилання */}
      <Card className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="text-caption text-fg-secondary uppercase tracking-wider">Ваш реферальний код</span>
            <div className="font-display text-h4 font-bold tracking-wider mt-1">{data.code}</div>
          </div>
          <Button variant="secondary" onClick={() => void page.copyCode()}>
            {page.copied ? 'Скопійовано!' : 'Скопіювати код'}
          </Button>
        </div>

        <div className="border-t border-line pt-4 flex flex-col gap-3">
          <span className="text-caption text-fg-secondary">Посилання для запрошення</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={data.shareUrl}
              className="w-full rounded-input border border-line bg-surface px-3 py-2 text-body text-fg select-all"
            />
            <Button onClick={() => void page.copyLink()}>Копіювати</Button>
            <Button variant="secondary" onClick={() => void page.shareNative()}>Поділитись</Button>
          </div>
        </div>

        {/* Ліміти місяця */}
        <div className="border-t border-line pt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-body font-medium">Місячний ліміт запрошень</span>
            <span className="text-caption text-fg-secondary">
              Використано {data.monthlyUsed} з {data.monthlyLimit} за цей місяць
            </span>
          </div>
          <Badge tone={remainingSlots > 0 ? 'accent' : 'warning'}>
            Залишилось місць: {remainingSlots}
          </Badge>
        </div>
      </Card>

      {/* Статистика балів */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-6 flex flex-col gap-1">
          <span className="text-caption text-fg-secondary">Зароблено бонусів</span>
          <span className="font-display text-h2 font-bold text-accent">{data.earnedPoints} ₴</span>
          <span className="text-caption text-fg-muted mt-1">Доступно для оплати послуг та товарів</span>
        </Card>
        <Card className="p-6 flex flex-col gap-1">
          <span className="text-caption text-fg-secondary">Успішних запрошень</span>
          <span className="font-display text-h2 font-bold">{data.referrals.filter(r => r.status === 'rewarded').length}</span>
          <span className="text-caption text-fg-muted mt-1">Друзів, які відвідали барбершоп</span>
        </Card>
      </div>

      {/* Список запрошених */}
      <div className="flex flex-col gap-4">
        <h2 className="font-display text-h4">Статус запрошених друзів</h2>
        {data.referrals.length === 0 ? (
          <Card className="p-8 text-center text-fg-secondary">
            У вас поки немає запрошених друзів. Поділіться посиланням вище!
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.referrals.map((ref) => {
              const meta = STATUS_LABEL[ref.status];
              return (
                <li key={ref.id}>
                  <Card className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4">
                    <div className="flex flex-col">
                      <span className="text-body font-medium text-fg">{ref.maskedName}</span>
                      <span className="text-caption text-fg-secondary">
                        Створено: {formatDate(ref.createdAt)}
                      </span>
                    </div>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
