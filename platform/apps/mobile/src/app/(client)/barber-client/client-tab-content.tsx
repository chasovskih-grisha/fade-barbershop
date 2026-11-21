import { Text } from 'react-native';
import { MobileEmptyState, MobileSkeleton } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import type { ExtendedAppointment } from '../../../lib/booking-contract';
import type { ClientTab } from './client-tabs';
import ClientVisits from './client-visits';

export default function ClientTabContent({
  tab,
  visits,
  loading,
  failed,
}: {
  tab: ClientTab;
  visits: ExtendedAppointment[];
  loading: boolean;
  failed: boolean;
}) {
  if (loading) return <MobileSkeleton />;
  if (failed) return <Text style={wipStyles.muted}>Не вдалося завантажити дані</Text>;
  if (tab === 'visits') return <ClientVisits visits={visits} />;
  if (tab === 'likes') return <MobileEmptyState message="Немає опублікованих вподобань" />;
  return <MobileEmptyState message="Немає нотаток" />;
}
