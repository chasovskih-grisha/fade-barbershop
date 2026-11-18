// Вибір фото для референсу зачіски (REF-MOB-01, REF-WEB-05). Ті самі ліміти,
// що на web: jpg/png/webp, ≤ 10 МБ (ADR 0015 §1). Сама валідація дублює
// серверну — щоб користувач дізнався про проблему до вивантаження 10 МБ.
import * as ImagePicker from 'expo-image-picker';
import type { PickedPhoto } from './api/reference-photo';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function toPickedPhoto(asset: ImagePicker.ImagePickerAsset): PickedPhoto {
  const type = asset.mimeType ?? 'image/jpeg';
  if (!ALLOWED_TYPES.includes(type)) {
    throw new Error('Файл має бути зображенням (jpg, png, webp)');
  }
  if (asset.fileSize && asset.fileSize > MAX_BYTES) {
    throw new Error('Розмір файлу не може перевищувати 10 МБ');
  }
  const extension = EXTENSIONS[type] ?? 'jpg';
  return { uri: asset.uri, name: asset.fileName ?? `reference.${extension}`, type };
}

/**
 * Галерея → локальний файл. `null` — користувач скасував вибір (не помилка).
 * Відмова в доступі кидає Error: без дозволу показати прев'ю неможливо.
 */
export async function pickReferencePhoto(): Promise<PickedPhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Потрібен доступ до галереї, щоб прикріпити фото');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  return asset ? toPickedPhoto(asset) : null;
}
