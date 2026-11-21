import { Toggle } from '@fade/ui';
import type {
  NotificationPreferences,
  NotificationToggleOption,
} from './notification-preferences-data';

export function NotificationToggleRow({
  option,
  preferences,
  saving,
  onChange,
}: {
  option: NotificationToggleOption;
  preferences: NotificationPreferences;
  saving: boolean;
  onChange: (key: keyof NotificationPreferences, value: boolean) => void;
}) {
  const classes = [
    'flex items-center justify-between py-2',
    option.bordered ? 'border-b border-line/40' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className="flex flex-col gap-0.5">
        <span className="font-text text-body font-medium">{option.label}</span>
        <span className="text-body-s text-fg-secondary">{option.description}</span>
      </div>
      <Toggle
        label={option.label}
        checked={preferences[option.key]}
        onChange={(e) => onChange(option.key, e.target.checked)}
        disabled={saving}
      />
    </div>
  );
}
