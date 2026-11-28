import { Pressable, Text, View } from 'react-native';
import { wipStyles } from '../../wip-styles';
import type { BarberScheduleLocation } from '../../../lib/api/barber-self-schedule';
import type { DayChoice } from '../../../lib/barber-unavailability';

export function LocationChoices({
  locations,
  locationId,
  onSelect,
}: {
  locations: BarberScheduleLocation[];
  locationId: string;
  onSelect: (id: string) => void;
}) {
  if (locations.length < 2) return null;
  return (
    <>
      {locations.map((location) => (
        <Pressable
          key={location.id}
          testID={`barber-location-${location.id}`}
          accessibilityRole="button"
          accessibilityState={{ selected: locationId === location.id }}
          onPress={() => onSelect(location.id)}
          style={[wipStyles.row, locationId === location.id && wipStyles.rowSelected]}
        >
          <Text style={wipStyles.cardTitle}>{location.name}</Text>
        </Pressable>
      ))}
    </>
  );
}

export function DayPicker({
  days,
  day,
  onSelect,
}: {
  days: DayChoice[];
  day: string;
  onSelect: (date: string) => void;
}) {
  return (
    <View style={wipStyles.tabs}>
      {days.map((choice, index) => (
        <Pressable
          key={choice.date}
          testID={`barber-day-${index}`}
          accessibilityRole="button"
          accessibilityState={{ selected: day === choice.date }}
          onPress={() => onSelect(choice.date)}
          style={[wipStyles.tab, day === choice.date && wipStyles.tabActive]}
        >
          <Text style={day === choice.date ? wipStyles.tabLabelActive : wipStyles.tabLabel}>
            {choice.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ScheduleStatus({
  loading,
  failed,
  locationsCount,
}: {
  loading: boolean;
  failed: boolean;
  locationsCount: number;
}) {
  if (loading) return <Text style={wipStyles.muted}>Завантаження...</Text>;
  if (failed) {
    return (
      <Text style={wipStyles.muted} testID="barber-schedule-failed">
        Не вдалося завантажити графік — оновіть екран
      </Text>
    );
  }
  if (locationsCount === 0) {
    return (
      <Notice
        testID="barber-schedule-no-locations"
        text="Вас не прикріплено до жодної локації — зверніться до адміністратора."
      />
    );
  }
  return null;
}

export function Notice({ testID, text }: { testID: string; text: string }) {
  return (
    <View style={wipStyles.banner} testID={testID}>
      <Text style={wipStyles.bannerText}>{text}</Text>
    </View>
  );
}
