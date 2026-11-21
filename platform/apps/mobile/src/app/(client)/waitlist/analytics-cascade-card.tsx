import { Text, View } from 'react-native';
import { MobileCard } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import type { CascadeData } from './waitlist-model';

const FIELDS: Array<{ key: keyof CascadeData; label: string }> = [
  { key: 'positionsFreed', label: 'Позицій звільнено' },
  { key: 'offered', label: 'Запропоновано' },
  { key: 'accepted', label: 'Прийнято' },
  { key: 'declined', label: 'Відхилено' },
  { key: 'expired', label: 'Прострочено' },
  { key: 'paused', label: 'Призупинено' },
];

export default function AnalyticsCascadeCard({ cascade }: { cascade: CascadeData }) {
  return (
    <MobileCard>
      <Text style={wipStyles.cardTitle}>FIFO Cascade Analytics</Text>
      {FIELDS.map((field) => (
        <View key={field.key} style={wipStyles.row}>
          <Text style={wipStyles.muted}>{field.label}</Text>
          <Text style={wipStyles.metricValue}>{cascade[field.key]}</Text>
        </View>
      ))}
    </MobileCard>
  );
}
