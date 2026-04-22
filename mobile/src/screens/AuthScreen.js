import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { signUp, signIn } from '../lib/supabase';
import { saveSession } from '../lib/storage';

export default function AuthScreen({ onLogin, onNeedOtp }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  async function submit() {
    if (!email.trim() || !password) { setError('E-posta ve şifre boş bırakılamaz.'); return; }
    if (password.length < 6)        { setError('Şifre en az 6 karakter olmalı.'); return; }

    setError('');
    setLoading(true);

    if (isRegister) {
      const data = await signUp(email.trim(), password);
      setLoading(false);
      if (data.error || data.msg) {
        setError(data.error_description || data.msg || 'Kayıt başarısız.');
      } else {
        onNeedOtp(email.trim());
      }
    } else {
      const data = await signIn(email.trim(), password);
      setLoading(false);
      if (data.error || !data.access_token) {
        setError(data.error_description || data.msg || 'Giriş başarısız.');
      } else {
        await saveSession(data);
        onLogin(data);
      }
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>{isRegister ? 'Kayıt Ol' : 'Giriş Yap'}</Text>
          <Text style={styles.subtitle}>
            {isRegister ? 'Yeni hesap oluştur.' : 'Görevlerine ulaşmak için giriş yap.'}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>E-posta</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="ornek@mail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
          />

          <Text style={styles.label}>Şifre</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="En az 6 karakter"
            secureTextEntry
            textContentType={isRegister ? 'newPassword' : 'password'}
            onSubmitEditing={submit}
            returnKeyType="done"
          />

          <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>{isRegister ? 'Kayıt Ol' : 'Giriş Yap'}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setIsRegister(!isRegister); setError(''); }}>
            <Text style={styles.switch}>
              {isRegister ? 'Zaten hesabın var mı? ' : 'Hesabın yok mu? '}
              <Text style={styles.switchLink}>{isRegister ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: '#f0f2f5' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card:      { backgroundColor: '#fff', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  title:     { fontSize: 22, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  subtitle:  { fontSize: 13, color: '#6b7280', marginBottom: 20 },
  error:     { backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 8, padding: 10, fontSize: 13, marginBottom: 14 },
  label:     { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 5 },
  input:     { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 8, padding: 11, fontSize: 15, marginBottom: 16, color: '#1f2937' },
  btn:       { backgroundColor: '#4f46e5', borderRadius: 8, padding: 13, alignItems: 'center', marginBottom: 14 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
  switch:    { textAlign: 'center', color: '#6b7280', fontSize: 13 },
  switchLink:{ color: '#4f46e5', fontWeight: '600' },
});
