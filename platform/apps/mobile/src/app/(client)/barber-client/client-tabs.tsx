import { Pressable, Text, View } from 'react-native';
import { wipStyles } from '../../wip-styles';

export type ClientTab = 'visits' | 'likes' | 'notes';

const TABS: Array<{ value: ClientTab; label: string }> = [
  { value: 'visits', label: 'Візити' },
  { value: 'likes', label: 'Вподобання' },
  { value: 'notes', label: 'Нотатки' },
];

export default function ClientTabs({
  active,
  onChange,
}: {
  active: ClientTab;
  onChange: (tab: ClientTab) => void;
}) {
  return (
    <View style={wipStyles.tabs}>
      {TABS.map((tab) => (
        <Pressable
          key={tab.value}
          accessibilityRole="button"
          onPress={() => onChange(tab.value)}
          style={[wipStyles.tab, active === tab.value && wipStyles.tabActive]}
        >
          <Text style={active === tab.value ? wipStyles.tabLabelActive : wipStyles.tabLabel}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
