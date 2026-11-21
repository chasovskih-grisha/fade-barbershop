import { Text, View } from 'react-native';
import { MobileCard } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import type { WaitlistMetrics } from './waitlist-model';

const FIELDS: Array<{ key: keyof WaitlistMetrics; label: string; suffix?: string }> = [
  { key: 'total', label: 'Записів' },
  { key: 'active', label: 'Активних' },
  { key: 'averageWaitMinutes', label: 'Середнє очікування', suffix: ' хв' },
  { key: 'offersPerHour', label: 'FIFO швидкість', suffix: '/год' },
  { key: 'completed', label: 'Завершено' },
];

export default function AnalyticsMetricsCard({ metrics }: { metrics: WaitlistMetrics }) {
  return (
    <MobileCard>
      <Text style={wipStyles.cardTitle}>Efficiency Metrics</Text>
      <View style={wipStyles.tabs}>
        {FIELDS.map((field) => (
          <View key={field.key} style={wipStyles.metric}>
            <Text style={wipStyles.cardMuted}>{field.label}</Text>
            <Text style={wipStyles.metricValue}>
              {String(metrics[field.key])}
              {field.suffix ?? ''}
            </Text>
          </View>
        ))}
      </View>
    </MobileCard>
  );
}
