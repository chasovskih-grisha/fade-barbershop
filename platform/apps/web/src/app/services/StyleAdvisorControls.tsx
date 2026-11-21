import { HAIR_TYPES, URGENCIES, type HairType, type Urgency } from './style-advisor-calculations';

interface StyleAdvisorControlsProps {
  hairType: HairType;
  urgency: Urgency;
  includeBeard: boolean;
  onHairType: (value: HairType) => void;
  onUrgency: (value: Urgency) => void;
  onIncludeBeard: (value: boolean) => void;
}

export function StyleAdvisorControls({
  hairType,
  urgency,
  includeBeard,
  onHairType,
  onUrgency,
  onIncludeBeard,
}: StyleAdvisorControlsProps) {
  return (
    <div className="lg:col-span-7 flex flex-col gap-6 bg-surface p-6 rounded-card border border-line shadow-inner">
      <div className="flex flex-col gap-3">
        <span className="font-semibold text-body text-fg">Бажаний стиль стрижки:</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {HAIR_TYPES.map((item) => (
            <button
              key={item.id}
              onClick={() => onHairType(item.id)}
              className={`flex flex-col items-start p-3 rounded-input border transition-all text-left ${
                hairType === item.id
                  ? 'border-accent bg-accent/10 text-fg shadow-sm'
                  : 'border-line bg-surface-sunken text-fg-secondary hover:border-fg-secondary'
              }`}
            >
              <span className="font-semibold text-body">{item.label}</span>
              <span className="text-caption text-fg-secondary/80">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {hairType !== 'beard' && (
        <div className="flex items-center justify-between p-4 rounded-input border border-line bg-surface-sunken">
          <div className="flex flex-col">
            <span className="font-semibold text-body text-fg">
              Додати моделювання бороди та вусів
            </span>
            <span className="text-caption text-fg-secondary">
              Фірмовий догляд з небезпечною бритвою та олією
            </span>
          </div>
          <button
            onClick={() => onIncludeBeard(!includeBeard)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              includeBeard ? 'bg-accent' : 'bg-surface-sunken border-line-strong'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-fg shadow ring-0 transition duration-200 ease-in-out ${
                includeBeard ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <span className="font-semibold text-body text-fg">Бажаний темп візиту:</span>
        <div className="grid grid-cols-3 gap-2">
          {URGENCIES.map((p) => (
            <button
              key={p.id}
              onClick={() => onUrgency(p.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-input border transition-all text-center ${
                urgency === p.id
                  ? 'border-accent-blue bg-accent-blue/15 text-fg shadow-sm'
                  : 'border-line bg-surface-sunken text-fg-secondary hover:border-fg-secondary'
              }`}
            >
              <span className="font-semibold text-body">{p.label}</span>
              <span className="text-caption text-fg-secondary">{p.time}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
