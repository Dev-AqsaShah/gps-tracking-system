import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDuty, AttendanceRecord } from '../context/DutyContext';
import { colors, shadow } from '../theme';

const fmt = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

const calcDuration = (start: string, end: string) => {
  const mins = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

export default function DayCloseScreen() {
  const { state, checkInTime, loading, endDuty, todayRecords } = useDuty();

  const closedRecords = todayRecords.filter((r: AttendanceRecord) => r.timeOut);
  const totalMins = closedRecords.reduce((acc: number, r: AttendanceRecord) =>
    acc + Math.floor((new Date(r.timeOut!).getTime() - new Date(r.timeIn).getTime()) / 60000), 0);
  const totalDuration = `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;

  const handleEndDuty = () => {
    Alert.alert('End Duty', 'Are you sure you want to close your current shift?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, End Duty', style: 'destructive', onPress: async () => {
          try {
            await endDuty();
          } catch {
            Alert.alert('Error', 'Could not end duty. Check server connection.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Day Close</Text>
        <Text style={styles.sub}>{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>

        {/* Active shift → show end duty button */}
        {state === 'active' && (
          <>
            <View style={styles.activeCard}>
              <View style={styles.activeDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activeTitle}>Shift In Progress</Text>
                <Text style={styles.activeSub}>Checked in at <Text style={{ color: colors.primary, fontWeight: '700' }}>{checkInTime}</Text></Text>
              </View>
            </View>

            <View style={styles.warningCard}>
              <Text style={styles.warningText}>⚠️  Ending duty will stop GPS tracking and close your current session. You can check in again anytime.</Text>
            </View>

            <TouchableOpacity style={styles.endDutyBtn} onPress={handleEndDuty} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" size="large" /> : (
                <>
                  <Text style={styles.btnIcon}>🔴</Text>
                  <Text style={styles.btnLabel}>END DUTY</Text>
                  <Text style={styles.btnSub}>Close your current session</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Not active */}
        {state === 'idle' && (
          <View style={styles.idleCard}>
            <Text style={styles.idleIcon}>{closedRecords.length > 0 ? '✅' : '⏸️'}</Text>
            <Text style={styles.idleTitle}>{closedRecords.length > 0 ? 'No Active Session' : 'Not Checked In'}</Text>
            <Text style={styles.idleSub}>
              {closedRecords.length > 0
                ? 'You can check in again anytime from the Attendance tab.'
                : 'Go to the Attendance tab to start your shift.'}
            </Text>
          </View>
        )}

        {/* Today's sessions summary */}
        {closedRecords.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Today's Sessions</Text>

            {closedRecords.map((rec: AttendanceRecord, i: number) => (
              <View key={rec.id} style={[styles.sessionRow, i < closedRecords.length - 1 && styles.sessionBorder]}>
                <View style={styles.sessionLeft}>
                  <Text style={styles.sessionNum}>Session {i + 1}</Text>
                  <Text style={styles.sessionTime}>{fmt(rec.timeIn)} → {fmt(rec.timeOut!)}</Text>
                </View>
                <Text style={styles.sessionDuration}>{calcDuration(rec.timeIn, rec.timeOut!)}</Text>
              </View>
            ))}

            {closedRecords.length > 1 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total time on duty</Text>
                <Text style={styles.totalValue}>{totalDuration}</Text>
              </View>
            )}
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
  sub: { fontSize: 13, color: colors.textMuted, marginBottom: 28 },

  activeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.successGlow, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.success, marginBottom: 14 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
  activeTitle: { fontSize: 15, fontWeight: '700', color: colors.success },
  activeSub: { fontSize: 13, color: colors.textSub, marginTop: 2 },

  warningCard: { backgroundColor: colors.warningGlow, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.warning, marginBottom: 24 },
  warningText: { fontSize: 13, color: colors.warning, lineHeight: 20 },

  endDutyBtn: { backgroundColor: colors.danger, borderRadius: 20, paddingVertical: 36, alignItems: 'center', marginBottom: 24, ...shadow },
  btnIcon: { fontSize: 40, marginBottom: 10 },
  btnLabel: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 1, marginBottom: 6 },
  btnSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },

  idleCard: { backgroundColor: colors.bgCard, borderRadius: 20, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 24, ...shadow },
  idleIcon: { fontSize: 52, marginBottom: 12 },
  idleTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8 },
  idleSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  summaryCard: { backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadow },
  summaryTitle: { fontSize: 13, fontWeight: '800', color: colors.textSub, padding: 14, paddingBottom: 10, letterSpacing: 0.5 },
  sessionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14 },
  sessionBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  sessionLeft: {},
  sessionNum: { fontSize: 11, color: colors.textMuted, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  sessionTime: { fontSize: 14, color: colors.text, fontWeight: '600' },
  sessionDuration: { fontSize: 15, fontWeight: '800', color: colors.primary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: colors.primaryGlow, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { fontSize: 13, color: colors.textSub, fontWeight: '600' },
  totalValue: { fontSize: 16, fontWeight: '800', color: colors.primary },
});
