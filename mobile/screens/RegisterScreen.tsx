import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import axios from 'axios';
import { BACKEND_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { colors, shadow } from '../theme';

export default function RegisterScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password || !name.trim()) {
      Alert.alert('Required', 'Email, password and full name are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_BASE_URL}/api/auth/register`, {
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        phone: phone.trim() || undefined,
        companyName: companyName.trim() || undefined,
      });
      if (res.data.success) await login(res.data.user);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Registration failed. Try again.';
      Alert.alert('Error', msg);
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>📡</Text>
          </View>
          <Text style={styles.appName}>TrackForce</Text>
          <Text style={styles.appTagline}>GPS Field Management</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Account</Text>
          <Text style={styles.cardSub}>Join your team on TrackForce</Text>

          <Text style={styles.label}>FULL NAME *</Text>
          <TextInput
            style={styles.input} value={name} onChangeText={setName}
            placeholder="Enter your full name" placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
          />

          <Text style={styles.label}>EMAIL ADDRESS *</Text>
          <TextInput
            style={styles.input} value={email} onChangeText={setEmail}
            placeholder="you@example.com" placeholderTextColor={colors.textMuted}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
          />

          <Text style={styles.label}>PASSWORD *</Text>
          <View style={styles.passWrap}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={password} onChangeText={setPassword}
              placeholder="Min. 6 characters" placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPass} autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(p => !p)}>
              <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 18 }]}>CONFIRM PASSWORD *</Text>
          <View style={styles.passWrap}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={confirmPassword} onChangeText={setConfirmPassword}
              placeholder="Re-enter password" placeholderTextColor={colors.textMuted}
              secureTextEntry={!showConfirm} autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(p => !p)}>
              <Text style={styles.eyeText}>{showConfirm ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OPTIONAL</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.label}>PHONE NUMBER</Text>
          <TextInput
            style={styles.input} value={phone} onChangeText={setPhone}
            placeholder="e.g. 03001234567" placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>COMPANY NAME</Text>
          <TextInput
            style={styles.input} value={companyName} onChangeText={setCompanyName}
            placeholder="Your company or organization" placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
          />

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>CREATE ACCOUNT</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>Already have an account? <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign In</Text></Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logoBox: { width: 70, height: 70, borderRadius: 20, backgroundColor: colors.primaryGlow, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoIcon: { fontSize: 32 },
  appName: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.5 },
  appTagline: { fontSize: 12, color: colors.textSub, marginTop: 4, letterSpacing: 1 },
  card: { backgroundColor: colors.bgCard, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border, ...shadow },
  cardTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
  cardSub: { fontSize: 13, color: colors.textSub, marginBottom: 24 },
  label: { fontSize: 11, color: colors.textMuted, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  input: { backgroundColor: colors.bgCard2, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.text, marginBottom: 18 },
  passWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 10 },
  eyeText: { fontSize: 18 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 1.5 },
  btn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, ...shadow },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  loginLink: { marginTop: 24, alignItems: 'center' },
  loginText: { fontSize: 14, color: colors.textSub },
});
