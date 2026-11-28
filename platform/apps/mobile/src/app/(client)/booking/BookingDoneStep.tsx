import { Pressable, Text, View } from 'react-native';
import type { DepositPayment } from '../../../lib/api/booking';
import { styles } from '../../index.styles';

interface BookingDoneStepProps {
  hasDeposit: boolean;
  payment: DepositPayment | null;
  onAppointments: () => void;
}

function depositCopy(hasDeposit: boolean, payment: DepositPayment | null): string {
  if (!hasDeposit) return 'Запис підтверджено. Депозит не потрібен.';
  if (payment?.outcome === 'already_paid') return 'Депозит уже сплачено.';
  if (payment?.outcome === 'captured') return 'Депозит сплачено.';
  return 'Запис створено.';
}

export function BookingDoneStep({ hasDeposit, payment, onAppointments }: BookingDoneStepProps) {
  return (
    <View style={styles.step}>
      <Text style={styles.cardMuted}>{depositCopy(hasDeposit, payment)}</Text>
      <Pressable accessibilityRole="button" style={styles.cta} onPress={onAppointments}>
        <Text style={styles.ctaLabel}>Мої візити</Text>
      </Pressable>
    </View>
  );
}
