interface ServiceOptionButtonProps {
  name: string;
  duration: number;
  price: number;
  selected: boolean;
  onToggle: () => void;
}

export function ServiceOptionButton({
  name,
  duration,
  price,
  selected,
  onToggle,
}: ServiceOptionButtonProps) {
  return (
    <button
      onClick={onToggle}
      type="button"
      className={`flex flex-col text-left p-4 rounded-card border transition-all cursor-pointer ${
        selected
          ? 'border-accent bg-accent/10 shadow-md ring-2 ring-accent/30'
          : 'border-line bg-surface hover:border-line-strong'
      }`}
    >
      <div className="flex items-center justify-between w-full mb-1">
        <span className="font-display font-bold text-fg text-body">{name}</span>
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
            selected ? 'bg-accent text-accent-fg' : 'border border-line'
          }`}
        >
          {selected ? '✓' : ''}
        </span>
      </div>
      <div className="flex items-center justify-between w-full text-caption text-fg-secondary">
        <span>{duration} хв</span>
        <span className="font-semibold text-fg">{price} ₴</span>
      </div>
    </button>
  );
}
