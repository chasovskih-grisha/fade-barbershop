import { Text, View } from 'react-native';
import { MobileButton } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';

export default function DoneStep({ onClose }: { onClose: () => void }) {
  return (
    <View style={wipStyles.content}>
      <Text style={wipStyles.title}>Запис створено</Text>
      <Text style={wipStyles.subtitle}>Будь ласка, перевірте своє email.</Text>
      <MobileButton title="Готово" onPress={onClose} />
    </View>
  );
}
