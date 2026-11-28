import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { wipStyles } from '../../../wip-styles';
import VisitChatScreen from '../../../../screens/chat/VisitChatScreen';

export default function AppointmentChatPage() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? (params.id[0] ?? '') : (params.id ?? '');

  return (
    <SafeAreaView style={wipStyles.screen}>
      <StatusBar barStyle="light-content" />
      <VisitChatScreen visitId={id} />
    </SafeAreaView>
  );
}
