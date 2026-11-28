import { Pressable, Text, View } from 'react-native';
import type { DepositPayment } from '../../../lib/api/booking';
import { styles } from '../../index.styles';

interface BookingPaymentStepProps {
  amount: number;
  remaining: number;
  payment: DepositPayment | null;
  loading: boolean;
  onPay: () => void;
  onChooseAnother: () => void;
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function BookingPaymentStep({
  amount,
  remaining,
  payment,
  loading,
  onPay,
  onChooseAnother,
}: BookingPaymentStepProps) {
  const expired = remaining <= 0 || payment?.outcome === 'expired';
  return (
    <View style={styles.step}>
      <Text style={styles.cardTitle}>Депозит {amount} ₴</Text>
      {expired ? (
        <>
          <Text style={styles.cardMuted}>Час на оплату минув</Text>
          <Text style={styles.cardMuted}>Місце звільнено. Кошти не списано.</Text>
          <Pressable accessibilityRole="button" style={styles.cta} onPress={onChooseAnother}>
            <Text style={styles.ctaLabel}>Обрати інший час</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.cardMuted}>Час на оплату: {formatRemaining(remaining)}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={loading}
            style={[styles.cta, loading ? styles.ctaDisabled : null]}
            onPress={onPay}
          >
            <Text style={styles.ctaLabel}>{loading ? 'Списуємо…' : `Сплатити ${amount} ₴`}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
