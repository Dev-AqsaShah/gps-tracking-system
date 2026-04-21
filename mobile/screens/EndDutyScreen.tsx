import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import { BACKEND_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { colors, shadow } from '../theme';

export default function EndDutyScreen() {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState<{ timeIn: string; timeOut: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [done, setDone] = useState(false);
  const [endTime, setEndTime] = useState('');

  useEffect(() => { fetchTodayRecord(); }, []);

  const fetchTodayRecord = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_BASE_URL}/api/attendance/today?userId=${user!.id}`);
      if (res.data.attendance) {
        setTodayRecord(res.data.attendance);
        if (res.data.attendance.timeOut) setDone(true);
      }
    } catch { }
    finally { setLoading(false); }
  };

  const endDuty = () => Alert.alert(
    'End Duty',
    'Are you sure you want to close your shift for today?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Duty', style: 'destructive', onPress: async () => {
          setEnding(true);
          try {
            await axios.post(`${BACKEND_BASE_URL}/api/attendance/checkout`, { userId: user!.id });
            const t = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            setEndTime(t);
            setDone(true);
          } catch {
            Alert.alert('Error', 'Could not end duty. Make sure server is running.');
          } finally { setEnding(false); }
        },
      },
    ]
  );

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const getDuration = () => {
    if (!todayRecord) return null;
    const start = new Date(todayRecord.timeIn);
    const end = todayRecord.timeOut ? new Date(todayRecord.timeOut) : new Date();
    const mins = Math.floor((end.getTime() - start.getTime()) / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  if (loading) return (
    <View style={[styles.screen, styles.center]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  if (done) return (
    <View style={styles.screen}>
      <View style={styles.doneWrap}>
        <Text style={styles.moonEmoji}>🌙</Text>
        <Text style={styles.doneTitle}>Shift Complete</Text>
        <Text style={styles.doneName}>{user?.name}</Text>

        <View style={styles.timeCard}>
          <View style={styles.timeRow}>
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>CHECK IN</Text>
              <Text style={styles.timeValue}>{todayRecord ? fmt(todayRecord.timeIn) : '—'}</Text>
            </View>
            <View style={styles.timeDivider} />
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>END DUTY</Text>
              <Text style={[styles.timeValue, { color: colors.success }]}>
                {todayRecord?.timeOut ? fmt(todayRecord.timeOut) : endTime}
              </Text>
            </View>
          </View>
          <View style={styles.durationRow}>
            <Text style={styles.durationLabel}>TOTAL DURATION</Text>
            <Text style={styles.durationValue}>{getDuration()}</Text>
          </View>
        </View>

        <View style={styles.syncBadge}>
          <View style={styles.syncDot} />
          <Text style={styles.syncText}>Report submitted to dashboard</Text>
        </View>

        <Text style={styles.seeYou}>See you tomorrow!</Text>
      </View>
    </View>
  );

  if (!todayRecord) return (
    <View style={styles.screen}>
      <View style={styles.doneWrap}>
        <Text style={{ fontSize: 56, marginBottom: 16 }}>⚠️</Text>
        <Text style={styles.doneTitle}>No Check-In Today</Text>
        <Text style={styles.doneName}>You haven't marked attendance yet.</Text>
        <Text style={[styles.seeYou, { marginTop: 12 }]}>Go to the Attendance tab first.</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.topLabel}>END OF SHIFT</Text>
      <Text style={styles.heading}>End Duty</Text>
      <Text style={styles.date}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </Text>

      {/* Session summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Session</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>SALESMAN</Text>
            <Text style={styles.summaryValue}>{user?.name}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.timeRow}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>CHECK IN</Text>
            <Text style={styles.timeValue}>{fmt(todayRecord.timeIn)}</Text>
          </View>
          <View style={styles.timeDivider} />
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>CURRENT TIME</Text>
            <Text style={[styles.timeValue, { color: colors.warning }]}>
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </Text>
          </View>
        </View>

        <View style={styles.durationRow}>
          <Text style={styles.durationLabel}>TIME ON FIELD</Text>
          <Text style={styles.durationValue}>{getDuration()}</Text>
        </View>
      </View>

      {/* GPS tracking status */}
      <View style={styles.trackingCard}>
        <View style={styles.trackingDot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.trackingTitle}>GPS Tracking Active</Text>
          <Text style={styles.trackingDesc}>Your route has been recorded and is visible on the admin dashboard.</Text>
        </View>
      </View>

      {/* End Duty button */}
      <TouchableOpacity style={styles.endBtn} onPress={endDuty} disabled={ending} activeOpacity={0.85}>
        {ending
          ? <ActivityIndicator color="#fff" size="large" />
          : (
            <>
              <Text style={styles.endBtnIcon}>🔴</Text>
              <Text style={styles.endBtnText}>END DUTY</Text>
              <Text style={styles.endBtnSub}>This will close your shift and stop tracking</Text>
            </>
          )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  container: { padding: 24, paddingBottom: 48 },

  topLabel: { fontSize: 11, color: colors.danger, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  heading: { fontSize: 32, fontWeight: '800', color: colors.text, marginBottom: 4 },
  date: { fontSize: 13, color: colors.textSub, marginBottom: 28 },

  summaryCard: {
    backgroundColor: colors.bgCard, borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: colors.border, marginBottom: 16, ...shadow,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: colors.textSub, marginBottom: 16, letterSpacing: 0.5 },
  summaryRow: { marginBottom: 12 },
  summaryItem: {},
  summaryLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },

  timeRow: { flexDirection: 'row', gap: 0 },
  timeItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  timeLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  timeValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
  timeDivider: { width: 1, backgroundColor: colors.border },

  durationRow: {
    marginTop: 16, backgroundColor: colors.bgCard2, borderRadius: 12, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  durationLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', letterSpacing: 1 },
  durationValue: { fontSize: 20, fontWeight: '800', color: colors.text },

  trackingCard: {
    backgroundColor: colors.successGlow, borderRadius: 14, padding: 16,
    flexDirection: 'row', gap: 12, alignItems: 'center',
    borderWidth: 1, borderColor: colors.success, marginBottom: 28,
  },
  trackingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
  trackingTitle: { fontSize: 14, fontWeight: '700', color: colors.success, marginBottom: 2 },
  trackingDesc: { fontSize: 12, color: colors.success, opacity: 0.8 },

  endBtn: {
    backgroundColor: colors.danger, borderRadius: 20, paddingVertical: 28,
    alignItems: 'center', ...shadow,
  },
  endBtnIcon: { fontSize: 32, marginBottom: 8 },
  endBtnText: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 1, marginBottom: 4 },
  endBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  // Done screen
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  moonEmoji: { fontSize: 64, marginBottom: 16 },
  doneTitle: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 4 },
  doneName: { fontSize: 16, color: colors.textSub, marginBottom: 28 },
  timeCard: {
    width: '100%', backgroundColor: colors.bgCard, borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: colors.border, marginBottom: 20, ...shadow,
  },
  syncBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.successGlow,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: colors.success, marginBottom: 16,
  },
  syncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  syncText: { fontSize: 13, color: colors.success, fontWeight: '600' },
  seeYou: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
});
