import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDuty, AttendanceRecord } from '../context/DutyContext';
import { useAuth } from '../context/AuthContext';
import { colors, shadow } from '../theme';

const fmt = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

const calcDuration = (start: string, end: string) => {
  const mins = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

export default function AttendanceScreen() {
  const { user } = useAuth();
  const { state, checkInTime, loading, markAttendance, todayRecords } = useDuty();

  const handleMark = async () => {
    try {
      await markAttendance();
    } catch {
      Alert.alert('Failed', 'Could not mark attendance. Check server connection.');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.sub}>{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>

        {/* Currently checked in banner */}
        {state === 'active' && (
          <View style={styles.activeBanner}>
            <View style={styles.gpsDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.activeBannerTitle}>Currently On Duty</Text>
              <Text style={styles.activeBannerSub}>Checked in at <Text style={{ fontWeight: '800', color: colors.primary }}>{checkInTime}</Text> — GPS tracking active</Text>
            </View>
          </View>
        )}

        {/* Mark Attendance button — always visible when idle */}
        {state === 'idle' && (
          <TouchableOpacity style={styles.attendanceBtn} onPress={handleMark} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" size="large" /> : (
              <>
                <Text style={styles.btnIcon}>📲</Text>
                <Text style={styles.btnLabel}>MARK ATTENDANCE</Text>
                <Text style={styles.btnSub}>Tap to check in — GPS will be recorded</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Today's attendance history table */}
        {todayRecords.length > 0 && (
          <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>Today's Attendance Records</Text>

            {/* Table header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { flex: 0.4 }]}>#</Text>
              <Text style={[styles.headerCell, { flex: 1.2 }]}>CHECK IN</Text>
              <Text style={[styles.headerCell, { flex: 1.2 }]}>END DUTY</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>DURATION</Text>
            </View>

            {todayRecords.map((rec: AttendanceRecord, i: number) => {
              const isActive = !rec.timeOut;
              const duration = rec.timeOut ? calcDuration(rec.timeIn, rec.timeOut) : '—';
              return (
                <View key={rec.id} style={[styles.tableRow, i % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
                  <Text style={[styles.cell, { flex: 0.4, color: colors.textMuted }]}>{todayRecords.length - i}</Text>
                  <Text style={[styles.cell, { flex: 1.2, color: colors.primary, fontWeight: '700' }]}>{fmt(rec.timeIn)}</Text>
                  <Text style={[styles.cell, { flex: 1.2, color: isActive ? colors.success : colors.text }]}>
                    {isActive ? '● Active' : fmt(rec.timeOut!)}
                  </Text>
                  <Text style={[styles.cell, { flex: 1, color: colors.textSub }]}>{duration}</Text>
                </View>
              );
            })}

            {/* Totals row */}
            {todayRecords.filter(r => r.timeOut).length > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total closed sessions: {todayRecords.filter(r => r.timeOut).length}</Text>
                <Text style={styles.totalDuration}>
                  {(() => {
                    const totalMins = todayRecords
                      .filter(r => r.timeOut)
                      .reduce((acc, r) => acc + Math.floor((new Date(r.timeOut!).getTime() - new Date(r.timeIn).getTime()) / 60000), 0);
                    return `${Math.floor(totalMins / 60)}h ${totalMins % 60}m total`;
                  })()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Empty state */}
        {todayRecords.length === 0 && state === 'idle' && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No attendance records yet today</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 22, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  sub: { fontSize: 13, color: colors.textMuted, marginBottom: 20 },

  activeBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.successGlow, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.success, marginBottom: 16 },
  gpsDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
  activeBannerTitle: { fontSize: 13, fontWeight: '800', color: colors.success, marginBottom: 2 },
  activeBannerSub: { fontSize: 12, color: colors.textSub },

  attendanceBtn: { backgroundColor: colors.primary, borderRadius: 20, paddingVertical: 32, alignItems: 'center', marginBottom: 24, ...shadow },
  btnIcon: { fontSize: 40, marginBottom: 10 },
  btnLabel: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 1, marginBottom: 6 },
  btnSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },

  tableCard: { backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadow },
  tableTitle: { fontSize: 13, fontWeight: '800', color: colors.textSub, padding: 14, paddingBottom: 10, letterSpacing: 0.5 },

  tableHeader: { flexDirection: 'row', backgroundColor: colors.bgCard2, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerCell: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 1 },

  tableRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowEven: { backgroundColor: colors.bgCard },
  rowOdd: { backgroundColor: colors.bgCard2 },
  cell: { fontSize: 13 },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: colors.primaryGlow, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { fontSize: 12, color: colors.textSub, fontWeight: '600' },
  totalDuration: { fontSize: 13, color: colors.primary, fontWeight: '800' },

  emptyCard: { backgroundColor: colors.bgCard, borderRadius: 16, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
