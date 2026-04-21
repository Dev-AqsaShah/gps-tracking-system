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
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location access is needed to mark attendance.');
        setLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = pos.coords;
      setLocation({ lat: latitude, lng: longitude });
      await axios.post(`${BACKEND_BASE_URL}/api/attendance/mark`, {
        userId: user!.id, lat: latitude, lng: longitude, photoUrl: null,
      });
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setMarked(true);
    } catch {
      Alert.alert('Failed', 'Could not mark attendance. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign Out', style: 'destructive', onPress: logout },
  ]);

  if (marked) return (
    <View style={styles.screen}>
      <View style={styles.successWrap}>
        <View style={styles.successRing}>
          <View style={styles.successCircle}>
            <Text style={styles.successTick}>✓</Text>
          </View>
        </View>
        <Text style={styles.successGreet}>Good Morning,</Text>
        <Text style={styles.successName}>{user?.name}</Text>
        <Text style={styles.successLabel}>CHECKED IN AT</Text>
        <Text style={styles.successTime}>{time}</Text>

        {location && (
          <View style={styles.coordCard}>
            <Text style={styles.coordLabel}>GPS LOCATION RECORDED</Text>
            <Text style={styles.coordText}>{location.lat.toFixed(5)}° N,  {location.lng.toFixed(5)}° E</Text>
          </View>
        )}

        <View style={styles.trackingBadge}>
          <View style={styles.dot} />
          <Text style={styles.trackingText}>Live tracking active — visible on dashboard</Text>
        </View>

        <Text style={styles.endHint}>When your shift ends, go to "End Duty" tab</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topLabel}>TRACKFORCE</Text>
          <Text style={styles.topDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileUsername}>@{user?.username}</Text>
          {user?.companyName ? <Text style={styles.profileMeta}>{user.companyName}</Text> : null}
          {user?.phone ? <Text style={styles.profileMeta}>{user.phone}</Text> : null}
        </View>
        <View style={styles.salesmanBadge}>
          <Text style={styles.salesmanText}>SALESMAN</Text>
        </View>
      </View>

      {/* Info cards */}
      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={styles.infoTitle}>Auto GPS</Text>
          <Text style={styles.infoSub}>Location auto-detected</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🕐</Text>
          <Text style={styles.infoTitle}>Timestamped</Text>
          <Text style={styles.infoSub}>Exact check-in time</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>☁️</Text>
          <Text style={styles.infoTitle}>Live Sync</Text>
          <Text style={styles.infoSub}>Visible on dashboard</Text>
        </View>
      </View>

      {/* Check In button */}
      <TouchableOpacity style={styles.checkInBtn} onPress={markAttendance} disabled={loading} activeOpacity={0.85}>
        {loading
          ? <ActivityIndicator color="#fff" size="large" />
          : (
            <>
              <Text style={styles.checkInIcon}>📲</Text>
              <Text style={styles.checkInText}>MARK ATTENDANCE</Text>
              <Text style={styles.checkInSub}>One tap to check in</Text>
            </>
          )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 24, paddingBottom: 48 },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  topLabel: { fontSize: 13, fontWeight: '800', color: colors.primary, letterSpacing: 2, marginBottom: 2 },
  topDate: { fontSize: 13, color: colors.textSub },
  logoutBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  logoutText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },

  profileCard: {
    backgroundColor: colors.bgCard, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: colors.border, flexDirection: 'row',
    alignItems: 'center', gap: 14, marginBottom: 20, ...shadow,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary,
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: colors.primary },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 2 },
  profileUsername: { fontSize: 13, color: colors.textSub },
  profileMeta: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  salesmanBadge: { backgroundColor: colors.primaryGlow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.primary },
  salesmanText: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 1 },

  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  infoCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  infoIcon: { fontSize: 22, marginBottom: 6 },
  infoTitle: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 2, textAlign: 'center' },
  infoSub: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },

  checkInBtn: {
    backgroundColor: colors.primary, borderRadius: 20, paddingVertical: 28,
    alignItems: 'center', ...shadow,
  },
  checkInIcon: { fontSize: 36, marginBottom: 8 },
  checkInText: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 1, marginBottom: 4 },
  checkInSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  // Success screen
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successRing: {
    width: 130, height: 130, borderRadius: 65, borderWidth: 2,
    borderColor: colors.success, alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  successCircle: {
    width: 104, height: 104, borderRadius: 52,
    backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center',
  },
  successTick: { fontSize: 50, color: '#fff' },
  successGreet: { fontSize: 16, color: colors.textSub, marginBottom: 4 },
  successName: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 16 },
  successLabel: { fontSize: 11, color: colors.textMuted, letterSpacing: 2, marginBottom: 4 },
  successTime: { fontSize: 42, fontWeight: '200', color: colors.primary, marginBottom: 24 },
  coordCard: {
    backgroundColor: colors.bgCard, borderRadius: 14, padding: 16, width: '100%',
    marginBottom: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  coordLabel: { fontSize: 10, color: colors.textMuted, letterSpacing: 2, marginBottom: 6 },
  coordText: { fontSize: 15, color: colors.success, fontWeight: '600' },
  trackingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.successGlow,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1,
    borderColor: colors.success, marginBottom: 16,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  trackingText: { fontSize: 13, color: colors.success, fontWeight: '600' },
  endHint: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
});
