// T-4619b: кінець утримання без списання. Окремий екран, щоб крок оплати
// лишався малим, а кожен текст відповідав фактичному результату.
interface Props {
  kind: 'expired' | 'failed' | 'unknown';
  checking?: boolean;
  onCheck?: (() => void) | undefined;
}

export default function DepositOutcome({ kind, checking = false, onCheck }: Props) {
  if (kind === 'unknown') {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="font-display text-h4">Не вдалося підтвердити оплату</h2>
        <p className="text-fg-secondary">
          Ми не отримали відповідь про списання. Перевірте статус візиту в «Моїх візитах».
        </p>
        {onCheck ? (
          <button type="button" className={PRIMARY_LINK} disabled={checking} onClick={onCheck}>
            {checking ? 'Перевіряємо…' : 'Перевірити статус'}
          </button>
        ) : null}
        <a href="/account/appointments" className={SECONDARY_LINK}>
          Мої візити
        </a>
        <BackToBooking secondary />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h2 className="font-display text-h4">
        {kind === 'expired' ? 'Час на оплату минув' : 'Оплату не проведено'}
      </h2>
      <p className="text-fg-secondary">
        {kind === 'expired'
          ? 'Крісло звільнено, бо оплату не проведено. Кошти не списані.'
          : 'Кошти не списані. Крісло звільнено — оберіть час ще раз.'}
      </p>
      <BackToBooking />
    </div>
  );
}

const PRIMARY_LINK =
  'inline-flex h-11 items-center justify-center rounded-input bg-accent px-4 font-text font-medium text-accent-fg transition-colors duration-150 hover:bg-fg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2';
const SECONDARY_LINK =
  'inline-flex h-11 items-center justify-center rounded-input bg-interactive px-4 font-text font-medium text-fg transition-colors duration-150 hover:bg-interactive-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2';

function BackToBooking({ secondary = false }: { secondary?: boolean }) {
  return (
    <a href="/booking" className={secondary ? SECONDARY_LINK : PRIMARY_LINK}>
      Записатися знову
    </a>
  );
}
