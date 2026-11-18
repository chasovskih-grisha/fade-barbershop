import { useEffect, useState } from 'react';
import { Text, TextInput, View, Pressable } from 'react-native';
import { getProfile, updateProfileName, type Birthday } from '@/lib/api/identity';
import { styles } from './profile-styles';
import { tokens } from '@fade/design-tokens';
import { BirthdayCard } from './birthday-card';
import { PushSection } from './push-section';

export function ProfileScreen() {
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState<Birthday | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProfile()
      .then((p) => {
        if (p.name) setName(p.name);
        setBirthday(p.birthday ?? null);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Вкажіть ім’я');
      return;
    }
    setError(null);
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateProfileName(trimmed);
      setName(updated.name ?? trimmed);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Не вдалося зберегти ім'я");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen} testID="profile-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Профіль</Text>
        <Text style={styles.subtitle}>Ваші дані і налаштування</Text>
      </View>

      <View style={[styles.card, { marginBottom: 16 }]}>
        <Text style={styles.label}>Ім’я</Text>
        <TextInput
          testID="profile-name-input"
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ваше ім’я"
          placeholderTextColor={tokens.color.text.muted.value}
          editable={!saving}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {saved ? <Text style={styles.successText}>Збережено</Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Зберегти ім'я"
          style={[styles.primaryButton, saving && styles.buttonDisabled]}
          onPress={() => void handleSave()}
          disabled={saving}
        >
          <Text
            style={{
              color: tokens.color.accent.onSolid.value,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            Зберегти ім&apos;я
          </Text>
        </Pressable>
      </View>

      <BirthdayCard initial={birthday} />

      <PushSection />
    </View>
  );
}
