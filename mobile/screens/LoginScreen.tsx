import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import axios from 'axios';
import { BACKEND_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { colors, shadow } from '../theme';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { Alert.alert('Required', 'Enter email and password.'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_BASE_URL}/api/auth/login`, { email: email.trim().toLowerCase(), password }, { timeout: 8000 });
      if (res.data.success) await login(res.data.user);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? `Cannot reach server at ${BACKEND_BASE_URL}. Check WiFi.`;
      Alert.alert('Login Failed', msg);
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>📡</Text>
          </View>
          <Text style={styles.appName}>TrackForce</Text>
          <Text style={styles.appTagline}>GPS Field Management</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSub}>Enter your credentials to continue</Text>

          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input} value={email} onChangeText={setEmail}
            placeholder="you@example.com" placeholderTextColor={colors.textMuted}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
          />

          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.passWrap}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={password} onChangeText={setPassword}
              placeholder="Enter password" placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPass} autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(p => !p)}>
              <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>SIGN IN</Text>}
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>New salesman? <Text style={{ color: colors.primary, fontWeight: '700' }}>Create Account</Text></Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logoBox: { width: 80, height: 80, borderRadius: 22, backgroundColor: colors.primaryGlow, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoIcon: { fontSize: 38 },
  appName: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: 0.5 },
  appTagline: { fontSize: 13, color: colors.textSub, marginTop: 4, letterSpacing: 1 },
  card: { backgroundColor: colors.bgCard, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border, ...shadow },
  cardTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
  cardSub: { fontSize: 13, color: colors.textSub, marginBottom: 24 },
  label: { fontSize: 11, color: colors.textMuted, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  input: { backgroundColor: colors.bgCard2, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.text, marginBottom: 18 },
  passWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  eyeBtn: { padding: 10 },
  eyeText: { fontSize: 18 },
  btn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', ...shadow },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  registerLink: { marginTop: 24, alignItems: 'center' },
  registerText: { fontSize: 14, color: colors.textSub },
});
