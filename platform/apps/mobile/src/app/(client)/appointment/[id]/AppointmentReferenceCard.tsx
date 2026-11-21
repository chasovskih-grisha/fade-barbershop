import { Text, View } from 'react-native';
import { MobileCard, MobileEmptyState } from '../../../../ui/kit';
import { wipStyles } from '../../../wip-styles';
import type { AppointmentReference } from './appointment-reference-api';

export default function AppointmentReferenceCard({
  reference,
}: {
  reference: AppointmentReference | null;
}) {
  if (!reference) {
    return <MobileEmptyState message="Для цього візиту AI-reference не визначено" />;
  }
  return (
    <MobileCard>
      <Text style={wipStyles.cardTitle}>AI Reference</Text>
      <View style={wipStyles.row}>
        <View style={wipStyles.rowBody}>
          <Text style={wipStyles.muted}>Обраний варіант</Text>
          <Text style={wipStyles.subtitle}>{reference.selectedOption}</Text>
        </View>
      </View>
      <View style={wipStyles.row}>
        <View style={wipStyles.rowBody}>
          <Text style={wipStyles.muted}>Оригінальний опис</Text>
          <Text style={wipStyles.subtitle}>{reference.originalText}</Text>
        </View>
      </View>
      <Text style={wipStyles.cardMuted}>
        Статус: {reference.isProcessed ? 'оброблено' : 'не оброблено'}
      </Text>
    </MobileCard>
  );
}
