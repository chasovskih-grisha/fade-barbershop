import { TIERS, type CommissionTier } from './commission-tiers';

const FIELD_CLASS =
  'mt-1 w-full rounded-input border border-line bg-surface-raised p-2 text-body text-fg';

export default function CommissionTierFields({
  tier,
  multiplier,
  onTierChange,
  onMultiplierChange,
}: {
  tier: CommissionTier;
  multiplier: string;
  onTierChange: (tier: CommissionTier) => void;
  onMultiplierChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label className="block text-caption">
        Рівень комісії (Tier)
        <select
          aria-label="Рівень комісії"
          value={tier}
          onChange={(event) => onTierChange(event.target.value as CommissionTier)}
          className={FIELD_CLASS}
        >
          {TIERS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-caption">
        Бонусний множник (Multiplier)
        <input
          type="number"
          step="0.01"
          min="0.5"
          max="2.5"
          aria-label="Бонусний множник"
          value={multiplier}
          onChange={(event) => onMultiplierChange(event.target.value)}
          className={FIELD_CLASS}
        />
      </label>
    </div>
  );
}
