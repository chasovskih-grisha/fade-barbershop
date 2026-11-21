import { Text, View } from 'react-native';
import { MobileButton, MobileCard, MobileEmptyState } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import type { WaitlistEntry } from './waitlist-model';

export default function WaitlistStatusCard({
  entries,
  onLeave,
}: {
  entries: WaitlistEntry[];
  onLeave: (id: string) => void;
}) {
  if (entries.length === 0) {
    return <MobileEmptyState message="Активних записів у листі очікування немає" />;
  }
  return (
    <MobileCard>
      <Text style={wipStyles.cardTitle}>Мій лист очікування ({entries.length})</Text>
      {entries.map((entry, index) => (
        <View key={entry.id} style={wipStyles.row}>
          <View style={wipStyles.rowBody}>
            <Text style={wipStyles.subtitle}>
              #{index + 1} · {entry.serviceName}
            </Text>
            <Text style={wipStyles.muted}>
              {entry.locationName} · {entry.barberName ?? 'Будь-який барбер'}
            </Text>
          </View>
          <MobileButton title="Вийти" onPress={() => onLeave(entry.id)} />
        </View>
      ))}
    </MobileCard>
  );
}
