import { Pressable, ScrollView, Text, View } from 'react-native';
import { styles } from '../../index.styles';

export function ArticleLoading() {
  return (
    <View style={styles.content}>
      <Text testID="article-loading" style={styles.cardMuted}>
        Завантаження...
      </Text>
    </View>
  );
}

export function ArticleMissing() {
  return (
    <View style={styles.content}>
      <Text style={styles.hero} testID="article-missing">
        Статтю не знайдено
      </Text>
    </View>
  );
}

export function ArticleError({ onRetry }: { onRetry: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.hero}>Не вдалося завантажити статтю</Text>
      <Pressable accessibilityRole="button" style={styles.cta} onPress={onRetry}>
        <Text style={styles.ctaLabel} testID="article-retry">
          Спробувати ще раз
        </Text>
      </Pressable>
    </ScrollView>
  );
}
