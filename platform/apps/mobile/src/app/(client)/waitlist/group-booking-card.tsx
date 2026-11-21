import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { MobileButton, MobileCard } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';

interface Participant {
  id: string;
  name: string;
  phone: string;
}

export default function GroupBookingCard({
  onSubmit,
}: {
  onSubmit: (participants: Participant[]) => void;
}) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const add = () => {
    if (!name.trim() || !phone.trim()) return;
    setParticipants((current) => [
      ...current,
      { id: `${Date.now()}`, name: name.trim(), phone: phone.trim() },
    ]);
    setName('');
    setPhone('');
  };

  return (
    <MobileCard>
      <Text style={wipStyles.cardTitle}>Груповий запис</Text>
      {participants.map((participant) => (
        <View key={participant.id} style={wipStyles.row}>
          <Text style={wipStyles.subtitle}>
            {participant.name} · {participant.phone}
          </Text>
        </View>
      ))}
      <TextInput
        accessibilityLabel="Ім'я учасника"
        placeholder="Ім'я"
        value={name}
        onChangeText={setName}
        style={wipStyles.input}
      />
      <TextInput
        accessibilityLabel="Телефон учасника"
        placeholder="+380..."
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={wipStyles.input}
      />
      <MobileButton title="Додати учасника" onPress={add} disabled={!name || !phone} />
      <MobileButton
        title="Підтвердити групу"
        onPress={() => onSubmit(participants)}
        disabled={participants.length === 0}
      />
    </MobileCard>
  );
}
