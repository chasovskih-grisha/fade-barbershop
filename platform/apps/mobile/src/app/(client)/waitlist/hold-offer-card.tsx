import { Text, View } from 'react-native';
import { MobileButton, MobileCard } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import { useHoldTimer } from './use-hold-timer';
import type { WaitlistEntry } from './waitlist-model';

export default function HoldOfferCard({
  entry,
  onAccept,
  onDecline,
}: {
  entry: WaitlistEntry | null;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const remaining = useHoldTimer(entry?.holdExpiry ?? null);
  if (!entry) return null;
  return (
    <MobileCard>
      <Text style={wipStyles.cardTitle}>Вам запропоновано слот</Text>
      <Text style={wipStyles.subtitle}>{entry.serviceName}</Text>
      <Text style={wipStyles.muted}>
        {entry.locationName} · {entry.barberName ?? 'Будь-який барбер'}
      </Text>
      <Text style={wipStyles.metricValue}>Залишилось: {remaining} с</Text>
      <View style={wipStyles.tabs}>
        <MobileButton title="Прийняти" onPress={onAccept} />
        <MobileButton title="Відхилити" onPress={onDecline} />
      </View>
    </MobileCard>
  );
}
