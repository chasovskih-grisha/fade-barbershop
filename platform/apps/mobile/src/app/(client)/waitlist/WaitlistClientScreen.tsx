import { useState } from 'react';
import { ScrollView, StatusBar, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MobileButton, MobileSkeleton } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import GroupBookingCard from './group-booking-card';
import HoldOfferCard from './hold-offer-card';
import OfflineBanner from './offline-banner';
import WaitlistStatusCard from './waitlist-status-card';
import { useWaitlist } from './use-waitlist';

export default function WaitlistClientScreen({
  visible = true,
  onClose = () => {},
}: {
  visible?: boolean;
  onClose?: () => void;
}) {
  const { entries, loading, reload, leave } = useWaitlist();
  const [notifications, setNotifications] = useState(true);
  const [groupMessage, setGroupMessage] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  if (!visible) return null;

  const offered = entries.find((entry) => entry.holdExpiry) ?? null;
  const accept = () => {
    setAccepted(true);
    if (offered) void leave(offered.id);
  };
  const decline = () => {
    if (offered) void leave(offered.id);
  };

  return (
    <SafeAreaView style={wipStyles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={wipStyles.content} style={wipStyles.scroll}>
        <View style={wipStyles.header}>
          <Text style={wipStyles.title}>Лист очікування</Text>
          <TouchableOpacity accessibilityRole="button" onPress={onClose}>
            <Text style={wipStyles.muted}>Закрити ×</Text>
          </TouchableOpacity>
        </View>
        <OfflineBanner />
        <View style={wipStyles.row}>
          <Text style={wipStyles.subtitle}>Сповіщення про вільний слот</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
        {loading ? <MobileSkeleton /> : null}
        {!loading ? <HoldOfferCard entry={offered} onAccept={accept} onDecline={decline} /> : null}
        {accepted ? <Text style={wipStyles.subtitle}>Слот прийнято</Text> : null}
        {!loading ? (
          <WaitlistStatusCard entries={entries} onLeave={(id) => void leave(id)} />
        ) : null}
        <GroupBookingCard
          onSubmit={(participants) =>
            setGroupMessage(`Групу з ${participants.length} учасників надіслано`)
          }
        />
        {groupMessage ? <Text style={wipStyles.subtitle}>{groupMessage}</Text> : null}
        <MobileButton title="Оновити" onPress={reload} />
      </ScrollView>
    </SafeAreaView>
  );
}

export { WaitlistClientScreen };
