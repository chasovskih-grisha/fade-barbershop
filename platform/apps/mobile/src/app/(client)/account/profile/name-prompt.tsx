import { Text } from 'react-native';
import { styles } from './profile-styles';

export const NAME_PROMPT = 'Як до вас звертатись?';

/** Sentence above the name field while the stored name is empty (T-4726c). */
export function NamePrompt({ storedName }: { storedName: string }) {
  if (storedName.trim() !== '') return null;
  return (
    <Text style={styles.namePrompt} testID="profile-name-prompt">
      {NAME_PROMPT}
    </Text>
  );
}
