'use client';

import { Card, Button, Badge } from '@fade/ui';

interface QuickConciergeCardsProps {
  copiedPhone: boolean;
  onCopyPhone: () => void;
}

export function QuickConciergeCards({ copiedPhone, onCopyPhone }: QuickConciergeCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6 flex flex-col justify-between space-y-4 bg-surface-base border border-line">
        <div>
          <Badge tone="success" className="mb-2">
            Онлайн 24/7
          </Badge>
          <h3 className="font-semibold text-h4 text-text-primary">Telegram-консьєрж</h3>
          <p className="text-xs text-text-muted mt-1">
            Миттєве вирішення питань щодо записів, підбору майстрів та підтримки в реальному часі.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => window.open('https://t.me/fade_support_bot', '_blank')}
          className="w-full"
        >
          Написати в Telegram
        </Button>
      </Card>

      <Card className="p-6 flex flex-col justify-between space-y-4 bg-surface-base border border-line">
        <div>
          <Badge tone="info" className="mb-2">
            Гаряча лінія
          </Badge>
          <h3 className="font-semibold text-h4 text-text-primary">Телефон підтримки</h3>
          <p className="text-xs text-text-muted mt-1">
            Дзвінки приймаються щодня з 09:00 до 21:00 для екстрених питань та скасування візитів.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              window.location.href = 'tel:+380443334455';
            }}
            className="flex-1 text-xs"
          >
            +38 (044) 333-44-55
          </Button>
          <Button
            variant="ghost"
            onClick={onCopyPhone}
            className="px-3 text-xs"
            title="Скопіювати номер"
          >
            {copiedPhone ? 'Скопійовано ✓' : 'Копіювати'}
          </Button>
        </div>
      </Card>

      <Card className="p-6 flex flex-col justify-between space-y-4 bg-surface-base border border-line">
        <div>
          <Badge tone="neutral" className="mb-2">
            VIP Клієнтам
          </Badge>
          <h3 className="font-semibold text-h4 text-text-primary">Персональний менеджер</h3>
          <p className="text-xs text-text-muted mt-1">
            Доступно для власників статусу FADE Black та VIP-карток.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            alert('Будь ласка, увійдіть у кабінет для зв’язку з персональним менеджером.')
          }
          className="w-full"
        >
          Зв’язатися з VIP
        </Button>
      </Card>
    </div>
  );
}
