import { ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MobileButton, MobileCard } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import PhotoStrip from './photo-strip';
import RatingPicker from './rating-picker';
import { useFeedbackForm } from './use-feedback-form';

export default function FeedbackSubmitScreen({
  visible = true,
  onClose = () => {},
  appointmentId = '',
  clientId = '',
}: {
  visible?: boolean;
  onClose?: () => void;
  appointmentId?: string;
  clientId?: string;
}) {
  const form = useFeedbackForm(appointmentId, clientId, onClose);
  if (!visible) return null;

  return (
    <SafeAreaView style={wipStyles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={wipStyles.content} style={wipStyles.scroll}>
        <View style={wipStyles.header}>
          <Text style={wipStyles.title}>Ваш відгук</Text>
          <Text style={wipStyles.subtitle}>Вікно відгуку відкрите 30 днів після візиту</Text>
        </View>
        <MobileCard>
          <Text style={wipStyles.cardTitle}>Оцініть свій візит</Text>
          <RatingPicker value={form.rating} onChange={form.setRating} />
          <Text style={wipStyles.cardMuted}>
            {form.rating ? `Оцінка: ${form.rating} зірок` : 'Оберіть оцінку'}
          </Text>
        </MobileCard>
        <MobileCard>
          <Text style={wipStyles.cardTitle}>Коментар (необов&apos;язково)</Text>
          <TextInput
            accessibilityLabel="Коментар до відгуку"
            placeholder="Напишіть про свій візит..."
            value={form.text}
            onChangeText={form.setText}
            maxLength={1000}
            multiline
            style={wipStyles.input}
          />
        </MobileCard>
        <MobileCard>
          <Text style={wipStyles.cardTitle}>Фото (до 3)</Text>
          <PhotoStrip
            photos={form.photos}
            onAdd={() => void form.addPhoto()}
            onRemove={(uri) =>
              form.setPhotos((current) => current.filter((value) => value !== uri))
            }
          />
        </MobileCard>
        {form.error ? <Text style={wipStyles.muted}>{form.error}</Text> : null}
        <MobileButton
          title="Надіслати відгук"
          onPress={() => void form.submit()}
          loading={form.submitting}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export { FeedbackSubmitScreen };
