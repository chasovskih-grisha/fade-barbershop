import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { getProfile, type Birthday } from '@/lib/api/identity';
import { styles } from './profile-styles';
import { BirthdayCard } from './birthday-card';
import { NameCard } from './name-card';
import { NoteCard } from './note-card';
import { PhoneCard } from './phone-card';
import { NotificationSwitches } from './notification-switches';
import { ProfileDoors } from './profile-doors';
import { SignOutCard } from './sign-out-card';
import { UnsavedPrompt } from './unsaved-prompt';
import { useNameDraft } from './use-name-draft';
import { useNoteDraft } from './use-note-draft';
import { useUnsavedLeave } from './use-unsaved-leave';
import { isProfileDirty } from './unsaved-guard';

export function ProfileScreen() {
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [birthday, setBirthday] = useState<Birthday | null>(null);
  const [preferences, setPreferences] = useState<string[]>([]);
  const name = useNameDraft(profileName);
  const note = useNoteDraft(preferences);
  const dirty = isProfileDirty(name.name, name.storedName, note.changed);
  const guard = useUnsavedLeave(dirty, async () => (await name.save()) && (await note.save()));

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfileName(p.name ?? '');
        setProfilePhone(p.phone);
        setBirthday(p.birthday ?? null);
        setPreferences(p.preferences ?? []);
      })
      .catch(() => {});
  }, []);

  return (
    <View style={styles.screen} testID="profile-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Профіль</Text>
        <Text style={styles.subtitle}>Ваші дані і налаштування</Text>
      </View>

      <ProfileDoors onOpen={guard.leave} />

      <NameCard draft={name} />

      <PhoneCard phone={profilePhone} />

      <BirthdayCard initial={birthday} />

      <NoteCard draft={note} />

      <NotificationSwitches />

      <SignOutCard />

      <UnsavedPrompt prompt={guard} />
    </View>
  );
}
