export default function ReferralNumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="block text-body-sm font-medium text-fg-secondary mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-input border border-border bg-surface px-3 py-2 text-fg"
      />
    </div>
  );
}
