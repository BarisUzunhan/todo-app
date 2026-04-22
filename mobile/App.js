import { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { loadSession, saveSession, clearSession } from './src/lib/storage';
import { refreshToken } from './src/lib/supabase';
import AuthScreen from './src/screens/AuthScreen';
import OtpScreen  from './src/screens/OtpScreen';
import TodoScreen from './src/screens/TodoScreen';

export default function App() {
  const [session, setSession]           = useState(null);
  const [pendingEmail, setPendingEmail] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await loadSession();
      if (saved) {
        if (Date.now() < saved.expires_at - 60_000) {
          setSession(saved);
        } else {
          const refreshed = await refreshToken(saved.refresh_token);
          if (refreshed?.access_token) {
            await saveSession(refreshed);
            setSession({ ...refreshed, user: refreshed.user });
          } else {
            await clearSession();
          }
        }
      }
      setInitializing(false);
    })();
  }, []);

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (session) {
    return (
      <>
        <StatusBar style="light" />
        <TodoScreen
          session={session}
          onLogout={() => setSession(null)}
        />
      </>
    );
  }

  if (pendingEmail) {
    return (
      <>
        <StatusBar style="dark" />
        <OtpScreen
          email={pendingEmail}
          onLogin={data => { setSession(data); setPendingEmail(null); }}
          onBack={() => setPendingEmail(null)}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <AuthScreen
        onLogin={data => setSession(data)}
        onNeedOtp={email => setPendingEmail(email)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' },
});
