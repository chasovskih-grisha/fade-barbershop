import { Text } from 'react-native';
import { MobileButton } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import type { ExtendedAppointment } from '../../../lib/booking-contract';
import ClientTabs, { type ClientTab } from './client-tabs';
import ClientTabContent from './client-tab-content';

export default function BarberClientBody({
  clientId,
  tab,
  visits,
  loading,
  failed,
  onTab,
  onBook,
}: {
  clientId: string;
  tab: ClientTab;
  visits: ExtendedAppointment[];
  loading: boolean;
  failed: boolean;
  onTab: (tab: ClientTab) => void;
  onBook: () => void;
}) {
  return (
    <>
      <Text style={wipStyles.title}>КАРТА КЛІЄНТА</Text>
      <Text style={wipStyles.subtitle}>{clientId || 'Клієнт'} · перегляд історії візитів</Text>
      <ClientTabs active={tab} onChange={onTab} />
      <ClientTabContent tab={tab} visits={visits} loading={loading} failed={failed} />
      <MobileButton title="Записатися" onPress={onBook} />
    </>
  );
}
