import { Pressable, Text, View } from 'react-native';
import { wipStyles } from '../../wip-styles';

export default function RatingPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (rating: number) => void;
}) {
  return (
    <View style={wipStyles.tabs}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <Pressable
          key={rating}
          accessibilityRole="button"
          accessibilityLabel={`${rating} зірок`}
          onPress={() => onChange(rating)}
          style={[wipStyles.tab, value === rating && wipStyles.tabActive]}
        >
          <Text style={value === rating ? wipStyles.tabLabelActive : wipStyles.tabLabel}>★</Text>
          <Text style={value === rating ? wipStyles.tabLabelActive : wipStyles.tabLabel}>
            {rating}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
