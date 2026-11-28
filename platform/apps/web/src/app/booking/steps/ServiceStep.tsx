import { useState, type KeyboardEvent } from 'react';
import { Card, Button, Skeleton } from '@fade/ui';
import { ServiceDto } from '../types';

// Обрана картка повторює кістяну плитку SlotPicker; класи скопійовані, не імпортовані.
const SELECTED_CARD =
  'rounded-card border border-accent bg-accent p-4 font-medium text-accent-fg cursor-pointer transition-colors hover:bg-fg-secondary active:bg-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue';

interface Props {
  services: ServiceDto[];
  loading?: boolean;
  onBack: () => void;
  onSelect: (svc: ServiceDto) => void;
  error?: string;
  optimisticSetStep?: (nextStep: number) => () => void;
  retryServices?: () => void;
}

export default function ServiceStep({ services, loading = false, error, onBack, onSelect, retryServices, optimisticSetStep: _optimisticSetStep }: Props) {
  const [selected, setSelected] = useState('');
  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-fg-secondary">Не вдалося завантажити послуги.</p>
        <Button onClick={retryServices}>Спробувати ще раз</Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" onClick={onBack}>
        ← Повернутись
      </Button>
      <h2 className="font-display text-h4">Оберіть послугу</h2>
      {services.length === 0 && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-fg-secondary">У цій локації послуг поки немає.</p>
          <Button variant="secondary" onClick={onBack}>
            Обрати іншу локацію
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((svc) => {
          const isSelected = selected === svc.id;
          const content = (
            <>
              <h3 className="font-text text-h4 font-semibold">{svc.name}</h3>
              <p>
                {svc.duration} хв, {svc.price} ₴
              </p>
            </>
          );
          const choiceProps = {
            role: 'button' as const,
            tabIndex: 0,
            'aria-pressed': isSelected,
            onClick: () => setSelected(svc.id),
            onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelected(svc.id);
              }
            },
          };
          return isSelected ? (
            <div key={svc.id} {...choiceProps} className={SELECTED_CARD}>
              {content}
            </div>
          ) : (
            <Card key={svc.id} interactive={true} {...choiceProps} className="p-4">
              {content}
            </Card>
          );
        })}
      </div>
      <Button
        disabled={!selected}
        onClick={() => {
          const svc = services.find((s) => s.id === selected);
          if (svc) {
            onSelect(svc);
          }
        }}
      >
        Далі
      </Button>
    </div>
  );
}
