// Feedback Submit Screen — T-150: Feedback Window.
// Client-facing feedback submission within 30-day window after completed visit.
// Integrates with push notifications (T-080) and completes the visit loop:
//   book → attend → feedback → loyalty points → referral.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  ImagePicker,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useTon } from '../../../../lib/use-ton';
import { usePush } from '../../../../lib/notifications';
import { submitFeedback } from '../../../../lib/api/feedbacks';
import { createFeedbackWindow } from '../../../../lib/api/feedbackwindow';

interface FeedbackSubmitScreenProps {
  visible: boolean;
  onClose: () => void;
  appointmentId: string;
  clientId: string;
}

export const FeedbackSubmitScreen: React.FC<FeedbackSubmitScreenProps> = ({
  visible,
  onClose,
  appointmentId,
  clientId,
}) => {
  const navigation = useNavigation();
  const { token, permission, register, error: pushError } = usePush();
  const { loyaltyPoints, referralCount } = useTon();

  // State for feedback form
  const [rating, setRating] = useState<number | null>(null);
  const [text, setText] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  // 30-day window check from appointment completion
  useEffect(() => {
    // Check if feedback window is still open
    // This would typically be done via API, but for now we assume window is open
    // if the visit was recent enough
  }, [appointmentId]);

  // Submit feedback
  const handleSubmit = async () => {
    if (rating === null) {
      Alert.alert('Будь ласка', 'Будь ласка, оцініть візит зі  зірочками');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitFeedback({
        appointmentId,
        clientId,
        rating,
        text: text.length > 0 ? text : undefined,
        photos,
      });

      // On successful submission, notify server to create/close FeedbackWindow
      // and trigger loyalty points / referral tracking
      if (result.success) {
        // Close the feedback window and update loyalty counter
        await createFeedbackWindow({
          appointmentId,
          status: 'SUBMITTED',
        });

        Alert.alert('Дякуємо!', 'Ваш відгук збережено!');
        setSubmitting(false);
        onClose();

        // Navigate to thank you or referrals screen
        navigation.navigate('MyVisits');
      }
    } catch (err) {
      Alert.alert('Помилка', err instanceof Error ? err.message : 'Невідома помилка');
      setSubmitting(false);
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      // Pick up to 3 - photos.length already tracked
      if (photos.length >= 3) {
        Alert.alert('Максимум фото', 'Можна завантажити максимум 3 фото');
        return;
      }

      const { cancelled, assets } = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        selectionLimit: 3 - photos.length,
      });

      if (!cancelled && assets) {
        const uri = assets[uri]?.uri || assets[uri]?.assets[uri]?.uri;
        if (uri) {
          setSelectedImageUri(uri);
          setShowImagePicker(true);
        }
      }
    } catch (err) {
      console.error('Image pick error:', err);
    }
  };

  // Confirm image upload
  const confirmImage = () => {
    if (selectedImageUri && !photos.includes(selectedImageUri)) {
      setPhotos(prev => [...prev, selectedImageUri]);
    }
    setSelectedImageUri(null);
    setShowImagePicker(false);
  };

  // Remove photo
  const removePhoto = (uri: string) => {
    setPhotos(prev => prev.filter(p => p !== uri));
  };

  // Check if feedback window is still open (within 30 days of visit)
  const visitWindowOpen = /* would check via API */ true;

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Чергове відгук</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>

      {/* Window status */}
      {!visitWindowOpen && (
        <View style={styles.windowClosed}>
          <Text style={styles.windowText}>
            Вікно для відгуків зачинене (просіяло 30 днів після візиту)
          </Text>
        </View>
      )}

      {/* Rating Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Оціньте свій візит</Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              style={[
                styles.ratingButton,
                rating === star && styles.ratingButtonSelected,
              ]}
              onPress={() => setRating(star)}
            >
              <Text style={styles.ratingText}>⭐</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingInfo}>
          {rating === null ? 'Оберіть оцінку' : `Оцінка: ${rating} зірок`}
        </Text>
      </View>

      {/* Text Review */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Коментар (необов'язково)</Text>
        <Text style={styles.textHint}>Максимум 1000 символів</Text>
        <Textarea
          placeholder="Напишіть про свій візит... "
          value={text}
          onChangeText={setText}
          maxLength={1000}
        />
      </View>

      {/* Photos Section */}
      {photos.length > 0 && (
        <View style={styles.photosSection}>
          <Text style={styles.photosTitle}>Фото до відгуку</Text>
          {photos.map((photoUri, i) => (
            <View key={i} style={styles.photoItem}>
              <Image
                source={{ uri: photoUri }}
                style={styles.photoPreview}
              />
              <TouchableOpacity
                style={styles.photoRemoveBtn}
                onPress={() => removePhoto(photoUri)}
              >
                <Text style={styles.photoRemoveText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {photos.length < 3 && (
        <TouchableOpacity onPress={pickImage} style={styles.addPhotoBtn}>
          <Text style={styles.addPhotoText}>
            {photos.length > 0 ? 'Додати ще фото' : 'Додати фото'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        {submitting ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitButtonText}>
              {loading ? 'Відправлення...' : 'Надіслати відгук'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Push notification status */}
      {pushError && (
        <View style={styles.pushError}>
          <Text style={styles.pushErrorText}>
            {pushError}
          </Text>
        </View>
      )}
    </View>
  );
};

// Textarea component
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  {
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    maxLength?: number;
  }
>(({ placeholder = ' ', value, onChangeText, maxLength = 1000 }, ref) => (
  <View style={{ flex: 1 }}>
    <textarea
      ref={ref}
      style={{
        height: 100,
        padding: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        backgroundColor: '#fff',
        color: '#000',
        fontSize: 14,
      }}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      maxLength={maxLength}
    />
  </View>
));
Textarea.displayName = 'Textarea';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f11',
    padding: Platform.select({
      ios: 20,
      android: 20,
    }),
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3f3f4f',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },

  closeButton: {
    padding: 6,
  },

  closeText: {
    color: '#888',
    fontSize: 16,
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 8,
  },

  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },

  ratingButton: {
    padding: 8,
    margin: 2,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
  },

  ratingButtonSelected: {
    backgroundColor: '#f6e05e',
  },

  ratingText: {
    fontSize: 24,
    color: '#f6e05e',
  },

  ratingInfo: {
    marginTop: 4,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
  },

  textHint: {
    marginBottom: 8,
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },

  textarea: {
    height: 100,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#000',
    fontSize: 14,
    marginBottom: 12,
  },

  photosSection: {
    marginBottom: 12,
  },

  photosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 8,
  },

  photoItem: {
    width: 80,
    height: 80,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  photoPreview: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
  },

  photoRemoveBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#e53e3e',
    borderRadius: 10,
    padding: 2,
  },

  photoRemoveText: {
    color: '#fff',
    fontSize: 12,
  },

  addPhotoBtn: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginBottom: 20,
    alignItems: 'center',
  },

  addPhotoText: {
    color: '#64748b',
    fontSize: 14,
  },

  submitContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    display: 'flex',
    justifyContent: 'flex-end',
  },

  submitButton: {
    backgroundColor: '#f6e05e',
    padding: 14,
    borderRadius: 8,
    width: '100%',
  },

  submitButtonText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  pushError: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },

  pushErrorText: {
    color: '#e53e3e',
    fontSize: 14,
  },
});

export default FeedbackSubmitScreen;