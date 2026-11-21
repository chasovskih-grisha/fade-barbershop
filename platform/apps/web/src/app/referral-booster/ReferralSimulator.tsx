import { Card } from '@fade/ui';

interface ReferralSimulatorProps {
  referralCount: number;
  onChange: (count: number) => void;
}

export function ReferralSimulator({ referralCount, onChange }: ReferralSimulatorProps) {
  return (
    <Card className="p-6 flex flex-col gap-3 bg-surface-sunken">
      <h3 className="font-display text-h4 font-medium">Симулятор рефералів (для тестування)</h3>
      <p className="text-caption text-fg-secondary">
        Змініть кількість успішних запрошень друзів для перевірки розблокування рівнів:
      </p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onChange(Math.max(0, referralCount - 1))}
          className="px-4 py-2 rounded border border-line bg-surface font-medium hover:bg-surface-hover"
        >
          - Зменшити
        </button>
        <span className="font-display text-xl font-bold">{referralCount}</span>
        <button
          onClick={() => onChange(referralCount + 1)}
          className="px-4 py-2 rounded border border-line bg-surface font-medium hover:bg-surface-hover"
        >
          + Збільшити
        </button>
      </div>
    </Card>
  );
}
