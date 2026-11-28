import { ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wipStyles } from '../../wip-styles';
import UnavailabilityBody from './unavailability-body';
import { useBarberUnavailability } from './use-barber-unavailability';

// T-4616b: екран барбера «не вийду» (barber-screens.md §5, SCH-BAR-02).
// Позначка йде тим самим `MarkBarberUnavailable`, що й з адмінки: візити не
// скасовуються, а стають відкритими конфліктами для рішення засновника.
export default function BarberScheduleScreen() {
  const state = useBarberUnavailability();

  return (
    <SafeAreaView style={wipStyles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={wipStyles.content} style={wipStyles.scroll}>
        <UnavailabilityBody state={state} />
      </ScrollView>
    </SafeAreaView>
  );
}
