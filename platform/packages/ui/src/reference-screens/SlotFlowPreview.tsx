import { useState } from 'react';
import { Button } from '../Button';
import { PriceBreakdown } from '../PriceBreakdown';
import { SlotPicker } from '../SlotPicker';
import type { Slot } from '../SlotPicker';
import { StepIndicator } from '../StepIndicator';

const STEPS = ['Послуга', 'Барбер', 'Час', 'Дані'];

const SLOTS: Slot[] = [
  { id: 's1', time: '10:00', state: 'free' },
  { id: 's2', time: '10:30', state: 'busy' },
  { id: 's3', time: '11:00', state: 'hold' },
  { id: 's4', time: '11:30', state: 'free', staff: 'Андрій' },
];

/** Крок вибору часу: індикатор кроків, сітка слотів і підсумок ціни. */
export function SlotFlowPreview() {
  const [selected, setSelected] = useState<string | null>('s1');

  return (
    <div className="flex flex-col gap-5">
      <StepIndicator steps={STEPS} current={2} />
      <SlotPicker slots={SLOTS} value={selected} onChange={setSelected} />
      <div className="rounded-card border border-line bg-surface-raised p-4">
        <PriceBreakdown service={{ label: 'Стрижка, 45 хв', amount: 600 }} finalAmount={600} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-fg-muted">
          {selected ? `Обрано: ${SLOTS.find((slot) => slot.id === selected)?.time}` : 'Час не обрано'}
        </span>
        <Button disabled={!selected}>Підтвердити</Button>
      </div>
    </div>
  );
}
