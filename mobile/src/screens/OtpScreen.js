import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { verifyOtp, signUp } from '../lib/supabase';
import { saveSession } from '../lib/storage';

export default function OtpScreen({ email, onLogin, onBack }) {
  const [code, setCode]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent]   = useState(false);

  async function verify() {
    if (code.trim().length !== 6) { setError('6 haneli kodu eksiksiz gir.'); return; }
    setError('');
    setLoading(true);
    const data = await verifyOtp(email, code.trim());
    setLoading(false);
    if (data.error || !data.access_token) {
      setError(data.error_description || data.msg || 'Kod hatalı veya süresi dolmuş.');
    } else {
      await saveSession(data);
      onLogin(data);
    }
  }

  async function resend() {
    setResent(false);
    await signUp(email, '');
    setResent(true);
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>E-postanı Doğrula</Text>
          <Text style={styles.subtitle}>
            <Text style={styles.email}>{email}</Text> adresine gönderilen 6 haneli kodu gir.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {resent ? <Text style={styles.success}>Kod yeniden gönderildi.</Text> : null}

          <TextInput
            style={[styles.input, styles.otpInput]}
            value={code}
            onChangeText={t => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
            onSubmitEditing={verify}
            returnKeyType="done"
          />

          <TouchableOpacity style={styles.btn} onPress={verify} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Doğrula</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: '#f0f2f5' },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  card:      { backgroundColor: '#fff', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  title:     { fontSize: 22, fontWeight: '700', color: '#1f2937', marginBottom: 6 },
  subtitle:  { fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 20 },
  email:     { fontWeight: '600', color: '#4f46e5' },
  error:     { backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 8, padding: 10, fontSize: 13, marginBottom: 14 },
  success:   { backgroundColor: '#d1fae5', color: '#065f46', borderRadius: 8, padding: 10, fontSize: 13, marginBottom: 14 },
  input:     { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 8, padding: 11, fontSize: 15, marginBottom: 16, color: '#1f2937' },
  otpInput:  { fontSize: 28, fontWeight: '700', letterSpacing: 8, color: '#4f46e5', borderColor: '#4f46e5' },
  btn:       { backgroundColor: '#4f46e5', borderRadius: 8, padding: 13, alignItems: 'center', marginBottom: 14 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
  backBtn:   { alignItems: 'center', marginTop: 4 },
  backText:  { color: '#6b7280', fontSize: 13 },
});
