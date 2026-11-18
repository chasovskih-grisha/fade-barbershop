import { useState } from 'react';
import { Card, Button, Skeleton } from '@fade/ui';
import { ServiceDto } from '../types';

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
        {services.map((svc) => (
          <Card
            key={svc.id}
            interactive={true}
            role="button"
            tabIndex={0}
            aria-pressed={selected === svc.id}
            className={`p-4 ${selected === svc.id ? 'ring-2 ring-fg' : ''}`}
            onClick={() => setSelected(svc.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelected(svc.id);
              }
            }}
          >
            <h3 className="font-text text-h4 font-semibold">{svc.name}</h3>
            <p>
              {svc.duration} хв, {svc.price} ₴
            </p>
          </Card>
        ))}
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
