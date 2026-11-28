import React, { useCallback, useEffect, useState, useTransition } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { styles } from './index.styles';
import { requestOtp, verifyOtp } from '../lib/api/identity';
import { useBiometricLogin, type MobileSession } from '../lib/use-biometric-login';
import { useSession, useSignInRequested, writeSession } from '../lib/session-store';
import { useStartupData } from '../lib/use-startup-data';
import { usePushRegistration } from '../lib/use-push-registration';
import { IndexLogin } from './index-login';
import { IndexHome } from './index-home';
import { IndexNav } from './index-nav';

export default function IndexPage() {
  const router = useRouter();
  const startup = useStartupData();
  const [activeTab, setActiveTab] = useState<'home' | 'login'>('home');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Сесія живе в одному сховищі застосунку (T-4717b, T-4723c): профіль гасить
  // її виходом, і контрол «Вхід» знову показує форму входу.
  const session = useSession();
  const signInRequested = useSignInRequested();
  const tab = signInRequested ? 'login' : activeTab;
  const [, startTransition] = useTransition();

  const openSession = useCallback((next: MobileSession) => {
    writeSession(next);
    startTransition(() => setActiveTab('home'));
  }, []);
  const biometric = useBiometricLogin(openSession);

  // T-070 (реopened): реєстрація Expo push-токена після створення сесії.
  // Мок-токен прибирається; реальний токен береться через getExpoPushTokenAsync
  // після отримання дозволу ОС, і реєструється тільки коли є валідний сесійний
  // токен (без анонімного кидання токена на сервер).
  const push = usePushRegistration();
  useEffect(() => {
    if (session?.accessToken) {
      push.register(session.accessToken).catch(() => {});
    }
  }, [session?.accessToken, push]);

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
          activeTab={tab}
          signedIn={session !== null}
          sessionName={session?.name}
          onHome={() => setActiveTab('home')}
          onLogin={() => setActiveTab('login')}
          onAccount={() => router.push('/(client)/account/appointments')}
          onVisits={() => router.push('/(client)/account/appointments')}
        />

        {tab === 'login' ? (
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
            stale={startup.stale}
            locations={startup.locations}
            services={startup.services}
            onRetryLocations={startup.retryLocations}
            onRetryServices={startup.retryServices}
            pushError={push.error}
            onEnablePush={() => {
              if (session?.accessToken) void push.register(session.accessToken);
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
