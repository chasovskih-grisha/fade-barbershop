'use client';

import { Card, Button, Badge } from '@fade/ui';
import { DIAGNOSTIC_SCENARIOS } from './support-data';

interface SupportDiagnosticProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function openAction(url: string) {
  if (url.startsWith('http') || url.startsWith('tel:')) {
    window.open(url, '_blank');
  } else {
    window.location.href = url;
  }
}

export function SupportDiagnostic({ selectedId, onSelect }: SupportDiagnosticProps) {
  const selected = DIAGNOSTIC_SCENARIOS.find((scenario) => scenario.id === selectedId);

  return (
    <Card className="p-6 md:p-8 bg-surface-base border border-line space-y-4">
      <div className="space-y-1">
        <Badge tone="info" className="mb-1">
          Інтерактивний помічник
        </Badge>
        <h3 className="font-display text-xl font-bold text-text-primary">
          Експрес-діагностика та вирішення питань
        </h3>
        <p className="text-xs text-text-muted">
          Оберіть вашу ситуацію для отримання миттєвої інструкції та прямої дії:
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {DIAGNOSTIC_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            onClick={() => onSelect(selectedId === scenario.id ? null : scenario.id)}
            className={`p-4 rounded-[var(--radius-card)] border text-left transition-all flex flex-col justify-between gap-2 ${
              selectedId === scenario.id
                ? 'border-action-primary bg-surface-sunken ring-1 ring-action-primary'
                : 'border-line hover:border-action-primary/50 bg-surface-base'
            }`}
          >
            <span className="font-semibold text-sm text-text-primary">{scenario.title}</span>
            <span className="text-[11px] text-action-primary font-medium underline">
              {selectedId === scenario.id ? 'Сховати поради ▲' : 'Вирішити ▼'}
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="p-4 rounded-lg bg-surface-sunken border border-accent/30 space-y-3">
          <p className="text-sm text-text-primary leading-relaxed">{selected.advice}</p>
          <Button
            variant="primary"
            onClick={() => openAction(selected.actionUrl)}
            className="text-xs"
          >
            {selected.actionLabel} →
          </Button>
        </div>
      )}
    </Card>
  );
}
