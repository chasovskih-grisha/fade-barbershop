// Екран чату візиту в mobile (T-081a): історія з сервера, надсилання через
// офлайн-чергу (повідомлення спершу лягає на пристрій) і стан «у черзі» для
// того, що ще не доїхало. Підписка на realtime у цьому слайсі не реалізована —
// транспорт нових повідомлень відсутній і винесений у дочірню задачу.

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { MobileButton, MobileCard } from '../../ui/kit';
import { wipStyles } from '../../app/wip-styles';
import { deviceStorage } from '../../lib/cache-storage';
import { enqueueMessage, flushQueue, loadQueue } from '../../chat/offline-queue';
import type { QueuedMessage } from '../../chat/offline-queue';
import {
  fetchVisitChat,
  sendVisitChatMessage,
  VisitChatUnavailable,
} from '../../chat/visit-chat-api';
import type { VisitChatMessage } from '../../chat/visit-chat-api';

const UNAVAILABLE_TEXT = 'Чат недоступний для цього візиту.';

const transport = {
  send: (visitId: string, body: string, clientMessageId: string) =>
    sendVisitChatMessage(visitId, body, clientMessageId),
};

// Один екземпляр на застосунок: без localStorage `deviceStorage()` віддає
// свіже сховище в пам'яті на кожен виклик, і черга губилась би між ними.
const chatStorage = deviceStorage();

export default function VisitChatScreen({ visitId }: { visitId: string }) {
  const [messages, setMessages] = useState<VisitChatMessage[]>([]);
  const [pending, setPending] = useState<QueuedMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const reload = useCallback(async () => {
    setPending(await loadQueue(chatStorage, visitId));
    try {
      setMessages(await fetchVisitChat(visitId));
      setUnavailable(false);
    } catch (error: unknown) {
      setUnavailable(error instanceof VisitChatUnavailable);
    }
    setLoading(false);
  }, [visitId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft('');
    try {
      // Спершу на диск: навіть якщо мережа впаде, ключ уже зафіксований.
      await enqueueMessage(chatStorage, visitId, body);
      await flushQueue(chatStorage, visitId, transport);
      await reload();
    } finally {
      setSending(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={wipStyles.content} style={wipStyles.scroll}>
      <View style={wipStyles.header}>
        <Text style={wipStyles.title}>Чат із майстром</Text>
      </View>
      {loading ? <Text style={wipStyles.muted}>Завантажуємо чат…</Text> : null}
      {unavailable ? <Text style={wipStyles.muted}>{UNAVAILABLE_TEXT}</Text> : null}
      {messages.map((message) => (
        <MobileCard key={message.id}>
          <Text style={wipStyles.cardMuted}>
            {message.senderRole === 'client' ? 'Ви' : 'Майстер'}
          </Text>
          <Text style={wipStyles.subtitle}>{message.body}</Text>
        </MobileCard>
      ))}
      {pending.map((entry) => (
        <MobileCard key={entry.clientMessageId}>
          <Text style={wipStyles.cardMuted}>Ви · у черзі</Text>
          <Text style={wipStyles.subtitle}>{entry.body}</Text>
        </MobileCard>
      ))}
      {!unavailable && !loading ? (
        <MobileCard>
          <TextInput
            testID="chat-input"
            placeholder="Напишіть майстру"
            value={draft}
            onChangeText={setDraft}
            style={wipStyles.subtitle}
          />
          <MobileButton title="Надіслати" onPress={send} disabled={sending || draft.trim() === ''} />
        </MobileCard>
      ) : null}
    </ScrollView>
  );
}
