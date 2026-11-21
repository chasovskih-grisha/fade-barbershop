import { Image, Pressable, Text, View } from 'react-native';
import { wipStyles } from '../../wip-styles';
import { feedbackStyles } from './feedback-styles';

export default function PhotoStrip({
  photos,
  onAdd,
  onRemove,
}: {
  photos: string[];
  onAdd: () => void;
  onRemove: (uri: string) => void;
}) {
  if (photos.length >= 3) return null;
  return (
    <View style={wipStyles.row}>
      {photos.map((uri) => (
        <Pressable key={uri} accessibilityRole="button" onPress={() => onRemove(uri)}>
          <Image source={{ uri }} style={feedbackStyles.photo} />
        </Pressable>
      ))}
      <Pressable accessibilityRole="button" onPress={onAdd} style={wipStyles.tab}>
        <Text style={wipStyles.tabLabel}>+ Фото</Text>
      </Pressable>
    </View>
  );
}
