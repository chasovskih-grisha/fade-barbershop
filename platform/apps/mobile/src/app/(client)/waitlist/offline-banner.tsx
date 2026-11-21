import { Text, View } from 'react-native';
import { wipStyles } from '../../wip-styles';

/** Показуємо корректну українську замість російського WIP-тексту «Показаны сохраненные данные». */
export default function OfflineBanner() {
  return (
    <View style={wipStyles.banner}>
      <Text style={wipStyles.bannerText}>
        Офлайн: показано збережені дані. Оновлення після з&apos;єднання.
      </Text>
    </View>
  );
}
