import { Pressable, Text, View } from 'react-native';
import { wipStyles } from '../../wip-styles';

export type CalendarMode = 'day' | 'week';

export default function CalendarToggle({
  mode,
  onChange,
}: {
  mode: CalendarMode;
  onChange: (mode: CalendarMode) => void;
}) {
  const options: Array<{ value: CalendarMode; label: string }> = [
    { value: 'day', label: 'День' },
    { value: 'week', label: 'Тиждень' },
  ];
  return (
    <View style={wipStyles.tabs}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          onPress={() => onChange(option.value)}
          style={[wipStyles.tab, mode === option.value && wipStyles.tabActive]}
        >
          <Text style={mode === option.value ? wipStyles.tabLabelActive : wipStyles.tabLabel}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
