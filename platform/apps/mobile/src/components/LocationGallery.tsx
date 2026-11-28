import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '@fade/design-tokens';
import type { LocationPhotoDto } from '../lib/api/locations';
import { LocationGalleryViewer } from './LocationGalleryViewer';

// T-4834b: фотографії студії вже в публічному payload, але в застосунку їх
// ніде не було. Сітка тримає `sortOrder`, тап відкриває повноекранний
// перегляд; без фото секції немає взагалі. Збій завантаження мініатюри — це
// токен-поверхня з підписом, а не порожня рамка.

const COLOR = tokens.color;

export function LocationGallery({ photos }: { photos: LocationPhotoDto[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sorted = [...photos].sort((a, b) => a.sortOrder - b.sortOrder);
  if (sorted.length === 0) return null;

  return (
    <View style={styles.section} testID="studio-gallery">
      <Text style={styles.heading}>Галерея</Text>
      <View style={styles.grid}>
        {sorted.map((photo, index) => (
          <Thumbnail key={photo.url} photo={photo} onPress={() => setOpenIndex(index)} />
        ))}
      </View>
      {openIndex !== null && sorted[openIndex] ? (
        <LocationGalleryViewer
          photos={sorted}
          index={openIndex}
          onChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </View>
  );
}

function Thumbnail({ photo, onPress }: { photo: LocationPhotoDto; onPress: () => void }) {
  const [failed, setFailed] = useState(false);
  const label = captionOf(photo);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Відкрити фото: ${label}`}
      testID={`studio-gallery-thumb-${photo.sortOrder}`}
      onPress={onPress}
      style={styles.thumb}
    >
      {failed ? (
        <Text style={styles.thumbFallback} testID={`studio-gallery-fallback-${photo.sortOrder}`}>
          {label}
        </Text>
      ) : (
        <Image
          source={{ uri: photo.url }}
          accessibilityLabel={label}
          resizeMode="cover"
          onError={() => setFailed(true)}
          style={styles.thumbImage}
        />
      )}
    </Pressable>
  );
}

export function captionOf(photo: LocationPhotoDto): string {
  return photo.caption ?? `Фото локації ${photo.sortOrder + 1}`;
}

const styles = StyleSheet.create({
  section: { marginTop: 24, gap: 12 },
  heading: {
    color: COLOR.text.primary.value,
    fontSize: tokens.typography.fontSize.h4.value,
    fontWeight: '700',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  thumb: {
    width: 104,
    aspectRatio: 1,
    borderRadius: tokens.radius.card.value,
    overflow: 'hidden',
    backgroundColor: COLOR.surface.sunken.value,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbFallback: {
    color: COLOR.text.muted.value,
    fontSize: tokens.typography.fontSize.caption.value,
    paddingHorizontal: 6,
    textAlign: 'center',
  },
});
