import { Button } from '@fade/ui';
import {
  FORM_LABELS,
  RECEIPT_LABELS,
  type OnsiteForm,
  type OnsiteReceipt,
  type OnsiteStatus,
} from './onsite-payment-types';

function ReceiptState({ receipt }: { receipt: OnsiteReceipt }) {
  return (
    <p className={receipt.status === 'failed' ? 'text-body text-semantic-danger' : 'text-body'}>
      {`${RECEIPT_LABELS[receipt.status]} · ${receipt.check_id}`}
      {receipt.error_message ? ` · ${receipt.error_message}` : ''}
    </p>
  );
}

function Paid({
  status,
  busy,
  onRetry,
}: {
  status: OnsiteStatus;
  busy: boolean;
  onRetry: () => void;
}) {
  const canRetry =
    status.paymentStatus !== 'complimentary' &&
    (status.receipt?.status === 'failed' || !status.receipt);
  return (
    <div className="mt-3 space-y-2">
      <p className="text-body font-semibold text-semantic-success">Решту сплачено.</p>
      {status.receipt ? <ReceiptState receipt={status.receipt} /> : null}
      {canRetry ? (
        <Button variant="secondary" disabled={busy} onClick={onRetry}>
          Повторити чек
        </Button>
      ) : null}
    </div>
  );
}

export function OnsitePaymentDetails({
  status,
  form,
  busy,
  onForm,
  onPay,
  onRetry,
}: {
  status: OnsiteStatus;
  form: OnsiteForm;
  busy: boolean;
  onForm: (form: OnsiteForm) => void;
  onPay: () => void;
  onRetry: () => void;
}) {
  if (status.paymentStatus === 'complimentary') {
    return (
      <p className="mt-3 text-body text-fg-secondary">Безоплатний візит — оплата не потрібна.</p>
    );
  }
  if (status.outstanding <= 0) return <Paid status={status} busy={busy} onRetry={onRetry} />;
  return (
    <div className="mt-4 space-y-3">
      <fieldset className="flex flex-wrap gap-4">
        <legend className="mb-1 block text-caption text-fg-muted">Форма оплати</legend>
        {(Object.keys(FORM_LABELS) as OnsiteForm[]).map((value) => (
          <label key={value} className="flex items-center gap-2 text-body">
            <input
              type="radio"
              name="onsite-form"
              value={value}
              checked={form === value}
              onChange={() => onForm(value)}
            />
            {FORM_LABELS[value]}
          </label>
        ))}
      </fieldset>
      <p className="text-caption text-fg-muted">
        {form === 'pos'
          ? 'Якщо POS недоступний, позначте оплату готівкою та проведіть її в касі.'
          : 'Сума фіксується сервером: змінити її вручну не можна.'}
      </p>
      <Button variant="primary" disabled={busy} onClick={onPay}>
        {busy ? 'Зберігаємо…' : `Позначити оплату (${FORM_LABELS[form]})`}
      </Button>
    </div>
  );
}
