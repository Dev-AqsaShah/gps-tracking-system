import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, SafeAreaView,
} from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { BACKEND_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { colors, shadow } from '../theme';

type ShiftState = 'not-checked-in' | 'active' | 'closed';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  const [shiftState, setShiftState] = useState<ShiftState>('not-checked-in');
  const [checkInTime, setCheckInTime] = useState('');   // formatted display
  const [checkInIso, setCheckInIso] = useState('');     // raw ISO for duration calc
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Check if already checked in today
  useEffect(() => {
    checkTodayStatus();
  }, []);

  const checkTodayStatus = async () => {
    try {
      const res = await axios.get(`${BACKEND_BASE_URL}/api/attendance/today?userId=${user!.id}`);
      const att = res.data.attendance;
      if (att) {
        setCheckInTime(fmt(att.timeIn));
        setCheckInIso(att.timeIn);
        if (att.timeOut) {
          setEndTime(fmt(att.timeOut));
          setDuration(calcDuration(att.timeIn, att.timeOut));
          setShiftState('closed');
        } else {
          setShiftState('active');
        }
      }
    } catch { }
    finally { setLoading(false); }
  };

  const markAttendance = async () => {
    setActionLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location access is needed to mark attendance.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = pos.coords;
      setLocation({ lat: latitude, lng: longitude });

      await axios.post(`${BACKEND_BASE_URL}/api/attendance/mark`, {
        userId: user!.id, lat: latitude, lng: longitude, photoUrl: null,
      });

      const nowIso = new Date().toISOString();
      setCheckInTime(fmt(nowIso));
      setCheckInIso(nowIso);
      setShiftState('active');
    } catch {
      Alert.alert('Failed', 'Could not mark attendance. Is the server running?');
    } finally {
      setActionLoading(false);
    }
  };

  const endDuty = () => {
    Alert.alert('End Duty', 'Close your shift for today?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, End Duty', style: 'destructive', onPress: async () => {
          setActionLoading(true);
          try {
            await axios.post(`${BACKEND_BASE_URL}/api/attendance/checkout`, { userId: user!.id });
            const endIso = new Date().toISOString();
            setEndTime(fmt(endIso));
            const res = await axios.get(`${BACKEND_BASE_URL}/api/attendance/today?userId=${user!.id}`);
            if (res.data.attendance) {
              setDuration(calcDuration(res.data.attendance.timeIn, res.data.attendance.timeOut ?? endIso));
            }
            setShiftState('closed');
          } catch {
            Alert.alert('Error', 'Could not end duty. Try again.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleLogout = () => Alert.alert('Sign Out', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign Out', style: 'destructive', onPress: logout },
  ]);

  if (loading) return (
    <View style={styles.screen}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>TrackForce</Text>
            <Text style={styles.dateText}>
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{user?.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <View style={[styles.statusDot,
              shiftState === 'active' ? styles.dotGreen :
              shiftState === 'closed' ? styles.dotGray : styles.dotOrange
            ]} />
          </View>
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileSub}>@{user?.username}</Text>
            {user?.companyName ? <Text style={styles.profileMeta}>🏢 {user.companyName}</Text> : null}
            {user?.phone ? <Text style={styles.profileMeta}>📞 {user.phone}</Text> : null}
          </View>
          <View style={[styles.shiftBadge,
            shiftState === 'active' ? styles.badgeGreen :
            shiftState === 'closed' ? styles.badgeGray : styles.badgeOrange
          ]}>
            <Text style={[styles.shiftBadgeText,
              shiftState === 'active' ? { color: colors.success } :
              shiftState === 'closed' ? { color: colors.textMuted } : { color: colors.warning }
            ]}>
              {shiftState === 'active' ? 'ON DUTY' : shiftState === 'closed' ? 'CLOSED' : 'OFFLINE'}
            </Text>
          </View>
        </View>

        {/* Live Clock */}
        <View style={styles.clockCard}>
          <Text style={styles.clockLabel}>CURRENT TIME</Text>
          <Text style={styles.clockTime}>
            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </Text>
        </View>

        {/* === STATE 1: Not checked in === */}
        {shiftState === 'not-checked-in' && (
          <>
            <View style={styles.infoRow}>
              <InfoChip icon="📍" text="Auto GPS" />
              <InfoChip icon="🕐" text="Timestamped" />
              <InfoChip icon="☁️" text="Live Sync" />
            </View>

            <TouchableOpacity
              style={styles.checkInBtn}
              onPress={markAttendance}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              {actionLoading
                ? <ActivityIndicator color="#fff" size="large" />
                : (
                  <View style={styles.btnInner}>
                    <Text style={styles.checkInIcon}>📲</Text>
                    <Text style={styles.checkInLabel}>MARK ATTENDANCE</Text>
                    <Text style={styles.checkInSub}>Tap to check in for today</Text>
                  </View>
                )}
            </TouchableOpacity>
          </>
        )}

        {/* === STATE 2: Active shift === */}
        {shiftState === 'active' && (
          <>
            <View style={styles.sessionCard}>
              <View style={styles.sessionRow}>
                <View style={styles.sessionItem}>
                  <Text style={styles.sessionLabel}>CHECKED IN</Text>
                  <Text style={styles.sessionValue}>{checkInTime}</Text>
                </View>
                <View style={styles.sessionDivider} />
                <View style={styles.sessionItem}>
                  <Text style={styles.sessionLabel}>DURATION</Text>
                  <Text style={[styles.sessionValue, { color: colors.success }]}>
                    {checkInIso ? calcDuration(checkInIso, now.toISOString()) : '—'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.trackingCard}>
              <View style={styles.pulsingDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.trackingTitle}>GPS Tracking Active</Text>
                <Text style={styles.trackingSub}>Your route is live on the admin dashboard</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.endDutyBtn}
              onPress={endDuty}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              {actionLoading
                ? <ActivityIndicator color="#fff" size="large" />
                : (
                  <View style={styles.btnInner}>
                    <Text style={styles.checkInIcon}>🔴</Text>
                    <Text style={styles.checkInLabel}>END DUTY</Text>
                    <Text style={styles.checkInSub}>Tap to close your shift</Text>
                  </View>
                )}
            </TouchableOpacity>
          </>
        )}

        {/* === STATE 3: Shift closed === */}
        {shiftState === 'closed' && (
          <View style={styles.closedCard}>
            <Text style={styles.closedMoon}>🌙</Text>
            <Text style={styles.closedTitle}>Shift Complete</Text>
            <Text style={styles.closedSub}>Great work today!</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>CHECK IN</Text>
                <Text style={styles.summaryValue}>{checkInTime}</Text>
              </View>
              <View style={styles.summaryArrow}>
                <Text style={{ color: colors.textMuted, fontSize: 20 }}>→</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>END DUTY</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>{endTime}</Text>
              </View>
            </View>

            <View style={styles.durationBadge}>
              <Text style={styles.durationLabel}>TOTAL SHIFT TIME</Text>
              <Text style={styles.durationValue}>{duration}</Text>
            </View>

            <View style={styles.syncRow}>
              <View style={styles.syncDot} />
              <Text style={styles.syncText}>Report submitted to dashboard</Text>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function InfoChip({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

const calcDuration = (start: string, end: string) => {
  const mins = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};


const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 22, paddingBottom: 48 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  brandName: { fontSize: 20, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  dateText: { fontSize: 13, color: colors.textSub, marginTop: 2 },
  signOutBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  signOutText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },

  profileCard: {
    backgroundColor: colors.bgCard, borderRadius: 18, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 14, ...shadow,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primary,
  },
  avatarInitial: { fontSize: 26, fontWeight: '800', color: colors.primary },
  statusDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.bgCard },
  dotGreen: { backgroundColor: colors.success },
  dotOrange: { backgroundColor: colors.warning },
  dotGray: { backgroundColor: colors.textMuted },
  profileText: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 2 },
  profileSub: { fontSize: 13, color: colors.textSub, marginBottom: 2 },
  profileMeta: { fontSize: 12, color: colors.textMuted },
  shiftBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  badgeGreen: { backgroundColor: colors.successGlow, borderColor: colors.success },
  badgeOrange: { backgroundColor: colors.warningGlow, borderColor: colors.warning },
  badgeGray: { backgroundColor: colors.bgCard2, borderColor: colors.border },
  shiftBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  clockCard: {
    backgroundColor: colors.bgCard, borderRadius: 16, padding: 18,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 18,
  },
  clockLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  clockTime: { fontSize: 36, fontWeight: '200', color: colors.text, letterSpacing: 2 },

  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  chip: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  chipIcon: { fontSize: 20, marginBottom: 4 },
  chipText: { fontSize: 11, color: colors.textSub, fontWeight: '600', textAlign: 'center' },

  checkInBtn: {
    backgroundColor: colors.primary, borderRadius: 20, paddingVertical: 30,
    alignItems: 'center', ...shadow,
  },
  endDutyBtn: {
    backgroundColor: colors.danger, borderRadius: 20, paddingVertical: 30,
    alignItems: 'center', ...shadow,
  },
  btnInner: { alignItems: 'center' },
  checkInIcon: { fontSize: 38, marginBottom: 10 },
  checkInLabel: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 1.5, marginBottom: 4 },
  checkInSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },

  sessionCard: {
    backgroundColor: colors.bgCard, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: colors.border, marginBottom: 14, ...shadow,
  },
  sessionRow: { flexDirection: 'row' },
  sessionItem: { flex: 1, alignItems: 'center' },
  sessionLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  sessionValue: { fontSize: 22, fontWeight: '800', color: colors.primary },
  sessionDivider: { width: 1, backgroundColor: colors.border },

  trackingCard: {
    backgroundColor: colors.successGlow, borderRadius: 14, padding: 16,
    flexDirection: 'row', gap: 12, alignItems: 'center',
    borderWidth: 1, borderColor: colors.success, marginBottom: 20,
  },
  pulsingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success },
  trackingTitle: { fontSize: 14, fontWeight: '700', color: colors.success },
  trackingSub: { fontSize: 12, color: colors.success, opacity: 0.8, marginTop: 2 },

  closedCard: {
    backgroundColor: colors.bgCard, borderRadius: 20, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...shadow,
  },
  closedMoon: { fontSize: 56, marginBottom: 12 },
  closedTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  closedSub: { fontSize: 14, color: colors.textSub, marginBottom: 24 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18, width: '100%', justifyContent: 'center' },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  summaryArrow: { paddingHorizontal: 4 },
  durationBadge: {
    backgroundColor: colors.bgCard2, borderRadius: 12, padding: 14, width: '100%',
    alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.border,
  },
  durationLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  durationValue: { fontSize: 28, fontWeight: '800', color: colors.text },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  syncText: { fontSize: 13, color: colors.success, fontWeight: '600' },
});
