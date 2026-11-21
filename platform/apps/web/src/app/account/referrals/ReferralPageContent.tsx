'use client';

import { AlertBanner, Skeleton } from '@fade/ui';
import { useReferralPage } from './useReferralPage';
import { ReferralShareCard } from './ReferralShareCard';
import { ReferralStats } from './ReferralStats';
import { ReferralList } from './ReferralList';

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

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-h3">Реферальна програма</h1>
        <p className="text-body-s text-fg-secondary">
          Запрошуйте друзів до FADE: друг отримує знижку на перший візит, а ви — 150 бонусних
          гривень після його завершення.
        </p>
      </header>

      {page.shareError ? (
        <AlertBanner tone="error" title="Увага">
          {page.shareError}
        </AlertBanner>
      ) : null}

      <ReferralShareCard
        code={data.code}
        shareUrl={data.shareUrl}
        monthlyUsed={data.monthlyUsed}
        monthlyLimit={data.monthlyLimit}
        copied={page.copied}
        onCopyCode={() => void page.copyCode()}
        onCopyLink={() => void page.copyLink()}
        onShareNative={() => void page.shareNative()}
      />

      <ReferralStats data={data} />
      <ReferralList referrals={data.referrals} />
    </div>
  );
}
