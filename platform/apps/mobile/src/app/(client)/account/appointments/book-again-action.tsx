import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ExtendedAppointment } from '../../../../lib/booking-contract';
import { getBookAgainIntent } from '../../../../lib/api/book-again';
import { bookAgainNotice, bookAgainParams } from './book-again';
import { styles } from './book-again-styles';

/**
 * Дія «Записатися знову» на завершеному візиті (T-4617b). Застосунок не має
 * власного майстра слота: дія запитує намір і відкриває той самий флоу
 * запису з чинними полями. Майбутній візит кнопки не має — там уже перенос.
 */
export function BookAgainAction({
  app,
  onBook,
}: {
  app: ExtendedAppointment;
  onBook: (params: Record<string, string>) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const intent = await getBookAgainIntent(app.id);
      setNotice(bookAgainNotice(intent));
      onBook(bookAgainParams(intent));
    } catch {
      setError('Не вдалося почати повторний запис — спробуйте пізніше');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        style={styles.button}
        onPress={() => void start()}
        disabled={busy}
      >
        <Text style={styles.buttonText}>{busy ? 'Готуємо…' : 'Записатися знову'}</Text>
      </Pressable>
      {notice || error ? (
        <Text accessibilityRole="alert" style={styles.notice}>
          {error ?? notice}
        </Text>
      ) : null}
    </View>
  );
}
