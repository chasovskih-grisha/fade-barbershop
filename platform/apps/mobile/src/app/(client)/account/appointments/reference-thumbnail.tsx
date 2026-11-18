import { useState, useEffect } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { ExtendedAppointment } from '../../../../lib/booking-contract';
import { getReferencePhotoUrl } from '../../../../lib/api/reference-photo';
import { styles } from './reference-thumbnail-styles';

export interface ReferenceThumbnailProps {
  app: ExtendedAppointment;
  /** Візит уже відкрито на редагування — повторна дія не потрібна. */
  editing?: boolean;
  onEditReference: (app: ExtendedAppointment) => void;
}

/**
 * Mobile reference thumbnail (REF-WEB-03 + ADR 0008 §2).
 *
 * The API read model sends `referenceId` (raw DB id, NOT a signed URL).
 * The signed URL is fetched separately via `GET /booking/reference-photos/:id`
 * (private S3 bucket), so mobile reuses the same semantics as the web
 * `AppointmentReference` instead of re-deriving the request.
 */
export function ReferenceThumbnail({ app, editing, onEditReference }: ReferenceThumbnailProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!app.referenceId) {
      setSignedUrl(null);
      return;
    }
    let alive = true;
    getReferencePhotoUrl(app.referenceId)
      .then((url) => {
        if (alive) setSignedUrl(url);
      })
      .catch(() => {
        if (alive) setSignedUrl(null);
      });
    return () => {
      alive = false;
    };
  }, [app.referenceId]);

  const visible = Boolean(signedUrl) || Boolean(app.referenceComment) || app.canEditReference;

  if (!visible) return null;

  return (
    <View style={styles.row}>
      <View style={styles.photoContainer}>
        {signedUrl ? (
          <Image
            source={{ uri: signedUrl }}
            style={styles.photo}
            accessibilityLabel="Референс зачіски"
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.emptyLabel}>
              {app.referenceId ? 'Фото недоступне' : 'Фото не прикріплене'}
            </Text>
          </View>
        )}
      </View>
      {app.referenceComment ? (
        <Text style={styles.comment} numberOfLines={2}>
          {app.referenceComment}
        </Text>
      ) : null}
      {app.canEditReference && !editing ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Редагувати референс і коментар"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => onEditReference(app)}
        >
          <Text style={styles.editLabel}>Редагувати</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
