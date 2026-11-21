import { AlertBanner } from '@fade/ui';
import { CASH_LIMIT } from './cash-model';

export default function CashAlerts({
  success,
  error,
  balance,
}: {
  success: string | null;
  error: string | null;
  balance: number;
}) {
  return (
    <>
      {success ? <AlertBanner tone="success" title="Успішно" description={success} /> : null}
      {error ? <AlertBanner tone="error" title="Помилка" description={error} /> : null}
      {balance > CASH_LIMIT ? (
        <AlertBanner
          tone="warning"
          title="Увага: Перевищення ліміту"
          description={`Готівка в касі (${balance} ₴) перевищує ліміт інкасації (${CASH_LIMIT} ₴). Рекомендується провести інкасацію.`}
        />
      ) : null}
    </>
  );
}
