import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MobileButton, MobileSkeleton } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import AnalyticsCascadeCard from './analytics-cascade-card';
import AnalyticsMetricsCard from './analytics-metrics-card';
import { computeCascade, computeMetrics } from './waitlist-model';
import { useWaitlist } from './use-waitlist';

export default function WaitlistAnalyticsDashboard({
  visible = true,
  onClose = () => {},
}: {
  visible?: boolean;
  onClose?: () => void;
}) {
  const { entries, loading, reload } = useWaitlist();
  if (!visible) return null;

  const metrics = computeMetrics(entries);
  const cascade = computeCascade(entries);

  return (
    <SafeAreaView style={wipStyles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={wipStyles.content} style={wipStyles.scroll}>
        <View style={wipStyles.header}>
          <Text style={wipStyles.title}>Waitlist Analytics</Text>
          <TouchableOpacity accessibilityRole="button" onPress={onClose}>
            <Text style={wipStyles.muted}>Закрити ×</Text>
          </TouchableOpacity>
        </View>
        {loading ? <MobileSkeleton /> : null}
        {!loading ? <AnalyticsMetricsCard metrics={metrics} /> : null}
        {!loading ? <AnalyticsCascadeCard cascade={cascade} /> : null}
        <MobileButton title="Оновити" onPress={reload} />
      </ScrollView>
    </SafeAreaView>
  );
}

export { WaitlistAnalyticsDashboard };
