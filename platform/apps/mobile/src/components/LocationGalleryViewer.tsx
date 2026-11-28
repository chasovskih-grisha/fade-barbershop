import React, { useEffect, useState } from 'react';
import { BackHandler, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '@fade/design-tokens';
import type { LocationPhotoDto } from '../lib/api/locations';
import { captionOf } from './LocationGallery';

// T-4834b: перегляд показує кадр повністю (`contain`), повний підпис,
// лічильник і «попереднє/наступне» по колу. Системна кнопка «назад»
// закриває перегляд і лишає людину на екрані студії.

const COLOR = tokens.color;

export function LocationGalleryViewer({
  photos,
  index,
  onChange,
  onClose,
}: {
  photos: LocationPhotoDto[];
  index: number;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const photo = photos[index];

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose]);

  useEffect(() => setFailed(false), [index]);

  if (!photo) return null;
  const step = (delta: number) => onChange((index + delta + photos.length) % photos.length);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop} testID="studio-gallery-backdrop">
        <View style={styles.panel} testID="studio-gallery-viewer">
          <View style={styles.topRow}>
            <Text style={styles.counter} testID="studio-gallery-counter">
              {index + 1} / {photos.length}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Закрити" testID="studio-gallery-close" onPress={onClose}>
              <Text style={styles.action}>Закрити</Text>
            </Pressable>
          </View>

          <View style={styles.frame}>
            {failed ? (
              <Text style={styles.fallback} testID="studio-gallery-viewer-fallback">
                {captionOf(photo)}
              </Text>
            ) : (
              <Image
                testID="studio-gallery-photo"
                source={{ uri: photo.url }}
                accessibilityLabel={captionOf(photo)}
                resizeMode="contain"
                onError={() => setFailed(true)}
                style={styles.photo}
              />
            )}
          </View>

          {photo.caption ? (
            <Text style={styles.caption} testID="studio-gallery-caption">
              {photo.caption}
            </Text>
          ) : null}

          <View style={styles.bottomRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Попереднє" testID="studio-gallery-prev" onPress={() => step(-1)}>
              <Text style={styles.action}>Попереднє</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Наступне" testID="studio-gallery-next" onPress={() => step(1)}>
              <Text style={styles.action}>Наступне</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLOR.surface.base.value,
    padding: 16,
    justifyContent: 'center',
  },
  panel: { gap: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  counter: { color: COLOR.text.secondary.value, fontSize: tokens.typography.fontSize.caption.value },
  action: { color: COLOR.text.primary.value, fontSize: tokens.typography.fontSize.body.value, fontWeight: '600' },
  frame: {
    aspectRatio: 3 / 2,
    width: '100%',
    borderRadius: tokens.radius.card.value,
    overflow: 'hidden',
    backgroundColor: COLOR.surface.sunken.value,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: '100%', height: '100%' },
  fallback: { color: COLOR.text.muted.value, paddingHorizontal: 12, textAlign: 'center' },
  caption: { color: COLOR.text.primary.value, fontSize: tokens.typography.fontSize.body.value },
});
