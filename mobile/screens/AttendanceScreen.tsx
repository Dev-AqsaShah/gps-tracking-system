import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { BACKEND_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { colors, shadow } from '../theme';

export default function AttendanceScreen() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [marked, setMarked] = useState(false);
  const [time, setTime] = useState('');

  const markAttendance = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Required', 'Location access needed.'); setLoading(false); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = pos.coords;
      setLocation({ lat: latitude, lng: longitude });
      await axios.post(`${BACKEND_BASE_URL}/api/attendance/mark`, { userId: user!.id, lat: latitude, lng: longitude, photoUrl: null });
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setMarked(true);
    } catch { Alert.alert('Failed', 'Could not mark attendance. Is backend running?'); }
    finally { setLoading(false); }
  };

  if (marked) return (
    <View style={styles.screen}>
      <View style={styles.successWrap}>
        <View style={styles.successRing}>
          <View style={styles.successCircle}>
            <Text style={styles.successTick}>✓</Text>
          </View>
        </View>
        <Text style={styles.successTitle}>Checked In</Text>
        <Text style={styles.successTime}>{time}</Text>
        {location && (
          <View style={styles.coordCard}>
            <Text style={styles.coordLabel}>GPS COORDINATES</Text>
            <Text style={styles.coordText}>{location.lat.toFixed(6)}° N</Text>
            <Text style={styles.coordText}>{location.lng.toFixed(6)}° E</Text>
          </View>
        )}
        <View style={styles.trackingBadge}>
          <View style={styles.dot} />
          <Text style={styles.trackingText}>Location tracking active</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topLabel}>FIELD AGENT</Text>
        <Text style={styles.topDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
      </View>

      <Text style={styles.heading}>Mark Attendance</Text>
      <Text style={styles.sub}>Confirm your GPS location to check in</Text>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileInitial}>{user?.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileUsername}>@{user?.username}</Text>
          {user?.companyName ? <Text style={styles.profileCompany}>{user.companyName}</Text> : null}
          {user?.phone ? <Text style={styles.profilePhone}>{user.phone}</Text> : null}
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => Alert.alert('Sign Out', 'Are you sure?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: logout },
        ])}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Info row */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={styles.infoLabel}>GPS Auto-Detected</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>🕐</Text>
          <Text style={styles.infoLabel}>Time Stamped</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>☁️</Text>
          <Text style={styles.infoLabel}>Synced to Server</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.btn} onPress={markAttendance} disabled={loading} activeOpacity={0.85}>
        {loading ? <ActivityIndicator color="#fff" /> : (
          <View style={styles.btnInner}>
            <Text style={styles.btnText}>CHECK IN NOW</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 24, paddingBottom: 48 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  topLabel: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 2 },
  topDate: { fontSize: 13, color: colors.textSub },
  heading: { fontSize: 30, fontWeight: '800', color: colors.text, marginBottom: 6 },
  sub: { fontSize: 14, color: colors.textSub, marginBottom: 28 },
  profileCard: { backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.primary },
  profileInitial: { fontSize: 22, fontWeight: '800', color: colors.primary },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700', color: colors.text },
  profileUsername: { fontSize: 13, color: colors.textSub },
  profileCompany: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  profilePhone: { fontSize: 12, color: colors.textMuted },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  logoutText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  infoRow: { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  infoItem: { flex: 1, alignItems: 'center' },
  infoIcon: { fontSize: 20, marginBottom: 6 },
  infoLabel: { fontSize: 11, color: colors.textSub, textAlign: 'center', fontWeight: '600' },
  infoDivider: { width: 1, backgroundColor: colors.border },
  btn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', ...shadow },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successRing: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: colors.success, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  successTick: { fontSize: 44, color: '#fff', fontWeight: '700' },
  successTitle: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 4 },
  successTime: { fontSize: 36, fontWeight: '300', color: colors.primary, marginBottom: 24 },
  coordCard: { backgroundColor: colors.bgCard, borderRadius: 14, padding: 16, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  coordLabel: { fontSize: 10, color: colors.textMuted, letterSpacing: 2, marginBottom: 8 },
  coordText: { fontSize: 16, color: colors.success, fontWeight: '600', fontVariant: ['tabular-nums'] },
  trackingBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.successGlow, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.success },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  trackingText: { fontSize: 13, color: colors.success, fontWeight: '600' },
});
