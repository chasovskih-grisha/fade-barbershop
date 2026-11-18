import React, { useCallback, useEffect, useState, useTransition } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { styles } from './index.styles';
import { requestOtp, verifyOtp } from '../lib/api/identity';
import { registerPushToken } from '../lib/api/push-tokens';
import { useBiometricLogin, type MobileSession } from '../lib/use-biometric-login';
import { useStartupData } from '../lib/use-startup-data';
import { IndexLogin } from './index-login';
import { IndexHome } from './index-home';
import { IndexNav } from './index-nav';

export default function IndexPage() {
  const router = useRouter();
  const startup = useStartupData();
  const [activeTab, setActiveTab] = useState<'home' | 'login'>('home');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Сесія живе лише в стані цього екрана (T-4717b): жодного другого сховища.
  // Забезпечує перемикання контролю «Вхід» на «Кабінет» після успішного входу.
  const [session, setSession] = useState<MobileSession | null>(null);
  const [, startTransition] = useTransition();

  const openSession = useCallback((next: MobileSession) => {
    const activeSessionState = next;
    const sessionToken = activeSessionState.accessToken;
    const sessionRefresh = activeSessionState.refreshToken;
    setSession(activeSessionState);
    startTransition(() => setActiveTab('home'));
  }, []);
  const biometric = useBiometricLogin(openSession);

  useEffect(() => {
    registerPushToken('mock-token', 'mobile').catch(() => {});
  }, []);

  const handleLogin = async () => {
    if (!phone) return;
    setSubmitting(true);
    try {
      await requestOtp(phone);
      const result = await verifyOtp(phone, '1111');
      // T-4426: біометричний ключ прив'язується до пари (user, refresh-seed).
      await biometric.remember(result.refreshToken);
      openSession(result);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <IndexNav
          activeTab={activeTab}
          signedIn={session !== null}
          sessionName={session?.name}
          onHome={() => setActiveTab('home')}
          onLogin={() => setActiveTab('login')}
          onAccount={() => router.push('/(client)/account/appointments')}
          onVisits={() => router.push('/(client)/account/appointments')}
        />

        {activeTab === 'login' ? (
          <IndexLogin
            phone={phone}
            setPhone={setPhone}
            submitting={submitting}
            onLogin={handleLogin}
            biometricAvailable={biometric.available}
            biometricError={biometric.error}
            onBiometric={() => void biometric.signIn()}
          />
        ) : (
          <IndexHome
            loading={startup.loading}
            stale={startup.stale}
            locations={startup.locations}
            services={startup.services}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
