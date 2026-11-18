import { Pressable, Text, View } from 'react-native';
import type { Birthday } from '@/lib/api/identity';
import { formatBirthday } from './birthday';
import { BirthdayPicker } from './birthday-picker';
import { useBirthdayDraft } from './use-birthday-draft';
import { styles } from './birthday-styles';

/** Картка дня народження (T-4730c): день і місяць, без року; «Очистити» прибирає. */
export function BirthdayCard({ initial }: { initial: Birthday | null }) {
  const { saved, day, month, setDay, setMonth, status, dirty, save, clear } =
    useBirthdayDraft(initial);
  const busy = status === 'saving';

  return (
    <View style={styles.card} testID="profile-birthday-card">
      <Text style={styles.label}>День народження</Text>
      <Text style={styles.value}>{saved ? formatBirthday(saved) : 'Дату не вказано'}</Text>
      <BirthdayPicker day={day} month={month} onDay={setDay} onMonth={setMonth} />
      {status === 'error' ? <Text style={styles.errorText}>Не вдалося зберегти</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Зберегти дату"
        testID="birth-save"
        onPress={() => void save()}
        disabled={!dirty || busy}
        style={[styles.primaryButton, (!dirty || busy) && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>Зберегти дату</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Очистити дату"
        testID="birth-clear"
        onPress={() => void clear()}
        disabled={saved === null || busy}
        style={[styles.clearButton, (saved === null || busy) && styles.buttonDisabled]}
      >
        <Text style={styles.clearText}>Очистити</Text>
      </Pressable>
    </View>
  );
}
