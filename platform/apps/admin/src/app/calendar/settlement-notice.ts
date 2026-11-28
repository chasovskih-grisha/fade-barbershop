// Що показати після рішення по конфлікту (T-4616b). Візит скасовано — але що з
// грошима: повертаються, вже повернулися чи провайдер відмовив. «Повертається»
// поверх збитку — неправда, тож `refund_failed` має свій текст і id для повтору.

export interface SettlementNotice {
  text: string;
  /** Повернення не пройшло: адмін має бачити це й мати чим повторити. */
  refundId?: string;
  /** Провайдерський статус невдалого refund — для пояснення й повтору. */
  refundStatus?: string;
}

interface SettlementResultView {
  outcome: string;
  refundId?: string;
  refundStatus?: string;
  failureReason?: string;
}

export function settlementNotice(body: unknown): SettlementNotice {
  const settlements = (body as { settlements?: SettlementResultView[] }).settlements ?? [];
  const failed = settlements.find((entry) => entry.outcome === 'refund_failed');
  if (failed) {
    return {
      text: 'Візит скасовано, але депозит не повернувся — повторіть повернення',
      ...(failed.refundId ? { refundId: failed.refundId } : {}),
      ...(failed.refundStatus === 'failed' ? { refundStatus: failed.refundStatus } : {}),
    };
  }
  const refunded = settlements.some(
    (entry) => entry.outcome === 'refund_initiated' || entry.outcome === 'refund_replayed'
  );
  return {
    text: refunded ? 'Візит скасовано, депозит повертається' : 'Рішення збережено',
  };
}

/** Результат повтору: провайдер міг відмовити вдруге — це не «відправлено». */
export function retryNotice(refundStatus: string | undefined): SettlementNotice {
  return refundStatus === 'failed'
    ? { text: 'Повернення знову не пройшло — зверніться до еквайрингу', refundStatus }
    : { text: 'Повернення депозиту відправлено' };
}
