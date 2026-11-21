import { Button } from '@fade/ui';

interface WaitlistInfo {
  entryId?: string;
  queuePosition?: number;
  estimatedWaitMinutes?: number;
}

interface EmptySlotsStateProps {
  waitlist?: WaitlistInfo | undefined;
  onJoinWaitlist?: (() => void) | undefined;
  onCancelWaitlist?: (() => void) | undefined;
  onBack: () => void;
}

export function EmptySlotsState({
  waitlist,
  onJoinWaitlist,
  onCancelWaitlist,
  onBack,
}: EmptySlotsStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-line bg-surface-raised p-4 text-center">
      <p className="font-display text-bodyLg">На цю дату слотів немає</p>
      <p className="text-sm text-fg-secondary">Спробуйте іншу дату або іншого барбера.</p>
      {waitlist?.entryId && (
        <div className="flex flex-col items-center gap-2 my-2">
          <p className="text-sm text-fg-secondary">Ви в черзі очікування</p>
          <p className="font-display text-h5">{waitlist.queuePosition ?? ''}-й місце</p>
          <p className="text-sm text-fg-secondary">
            Очікувано {waitlist.estimatedWaitMinutes ?? ''} хв
          </p>
          <Button variant="secondary" onClick={onCancelWaitlist}>
            Скасувати запис
          </Button>
        </div>
      )}
      {!waitlist?.entryId && onJoinWaitlist && (
        <Button variant="primary" onClick={onJoinWaitlist} className="mb-2">
          Приєднатися до черги очікування
        </Button>
      )}
      <Button variant="secondary" onClick={onBack}>
        Обрати іншого барбера
      </Button>
    </div>
  );
}
