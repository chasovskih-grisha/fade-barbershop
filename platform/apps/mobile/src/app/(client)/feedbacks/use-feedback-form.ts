import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { submitFeedback } from './feedback-api';

export function useFeedbackForm(appointmentId: string, clientId: string, onClose: () => void) {
  const [rating, setRating] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPhoto = async () => {
    if (photos.length >= 3) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      selectionLimit: 3 - photos.length,
    });
    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setPhotos((current) => [...current, ...uris].slice(0, 3));
    }
  };

  const submit = async () => {
    if (!rating) {
      setError('Будь ласка, оцініть візит');
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await submitFeedback({ appointmentId, clientId, rating, text, photos });
    setSubmitting(false);
    if (result.success) onClose();
    else setError('Не вдалося зберегти відгук');
  };

  return {
    rating,
    setRating,
    text,
    setText,
    photos,
    setPhotos,
    addPhoto,
    submit,
    submitting,
    error,
  };
}
