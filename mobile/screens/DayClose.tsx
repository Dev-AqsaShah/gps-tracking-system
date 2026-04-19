import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import { BACKEND_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { colors, shadow } from '../theme';

export default function DayClose() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ orders: 0, returns: 0, visits: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_BASE_URL}/api/day/stats?userId=${user!.id}`);
      if (res.data.success) setStats(res.data.stats);
    } catch { }
    finally { setLoading(false); }
  };

  const closeDay = () => Alert.alert('Close Day?', 'Submit your daily report and end tracking?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Confirm', style: 'destructive', onPress: async () => {
      setSubmitting(true);
      try {
        await axios.post(`${BACKEND_BASE_URL}/api/day/close`, { userId: user!.id, ...stats });
        setClosed(true);
      } catch { Alert.alert('Error', 'Could not close day.'); }
      finally { setSubmitting(false); }
    }},
  ]);

  if (loading) return <View style={[styles.screen, styles.center]}><ActivityIndicator size="large" color={colors.primary} /></View>;

  if (closed) return (
    <View style={[styles.screen, styles.center]}>
      <Text style={{ fontSize: 64 }}>🌙</Text>
      <Text style={styles.closedTitle}>Day Closed</Text>
      <Text style={styles.closedSub}>Report submitted successfully</Text>
      <Text style={styles.closedSub}>See you tomorrow!</Text>
    </View>
  );

  const conversion = stats.visits > 0 ? Math.round((stats.orders / stats.visits) * 100) : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.topLabel}>END OF DAY REPORT</Text>
      <Text style={styles.heading}>Day Summary</Text>
      <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Text>

      {/* Big stats */}
      <View style={styles.statsRow}>
        <BigStat value={stats.orders} label="Orders" color={colors.primary} glow={colors.primaryGlow} />
        <BigStat value={stats.visits} label="Visits" color={colors.success} glow={colors.successGlow} />
        <BigStat value={stats.returns} label="Returns" color={colors.warning} glow={colors.warningGlow} />
      </View>

      {/* Detail card */}
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>Performance Overview</Text>
        <DetailRow label="Total customers visited" value={String(stats.visits)} />
        <DetailRow label="Orders placed" value={String(stats.orders)} />
        <DetailRow label="Returns processed" value={String(stats.returns)} />
        <DetailRow label="Order conversion rate" value={`${conversion}%`} highlight={conversion >= 70} />
      </View>

      {/* Performance bar */}
      <View style={styles.perfCard}>
        <View style={styles.perfHeader}>
          <Text style={styles.perfLabel}>CONVERSION RATE</Text>
          <Text style={[styles.perfPct, { color: conversion >= 70 ? colors.success : conversion >= 40 ? colors.warning : colors.danger }]}>
            {conversion}%
          </Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, {
            width: `${Math.min(conversion, 100)}%` as any,
            backgroundColor: conversion >= 70 ? colors.success : conversion >= 40 ? colors.warning : colors.danger,
          }]} />
        </View>
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={fetchStats}>
        <Text style={styles.refreshText}>🔄  Refresh Stats</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.closeBtn} onPress={closeDay} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : (
          <>
            <Text style={styles.closeBtnText}>CLOSE DAY & SUBMIT</Text>
            <Text style={styles.closeBtnSub}>This will end your shift</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function BigStat({ value, label, color, glow }: any) {
  return (
    <View style={[styles.bigStat, { backgroundColor: glow, borderColor: color + '44' }]}>
      <Text style={[styles.bigValue, { color }]}>{value}</Text>
      <Text style={styles.bigLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailKey}>{label}</Text>
      <Text style={[styles.detailVal, highlight && { color: colors.success }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  container: { padding: 24, paddingBottom: 48 },
  topLabel: { fontSize: 11, color: colors.primary, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  heading: { fontSize: 30, fontWeight: '800', color: colors.text, marginBottom: 4 },
  date: { fontSize: 13, color: colors.textSub, marginBottom: 28 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  bigStat: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1.5, ...shadow },
  bigValue: { fontSize: 34, fontWeight: '800', marginBottom: 2 },
  bigLabel: { fontSize: 11, color: colors.textSub, fontWeight: '600' },
  detailCard: { backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  detailTitle: { fontSize: 13, fontWeight: '700', color: colors.textSub, marginBottom: 14, letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailKey: { fontSize: 14, color: colors.textSub },
  detailVal: { fontSize: 14, fontWeight: '700', color: colors.text },
  perfCard: { backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  perfHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  perfLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', letterSpacing: 1 },
  perfPct: { fontSize: 16, fontWeight: '800' },
  barBg: { height: 8, backgroundColor: colors.bgCard2, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  refreshBtn: { backgroundColor: colors.bgCard, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  refreshText: { color: colors.textSub, fontWeight: '600', fontSize: 14 },
  closeBtn: { backgroundColor: colors.danger, borderRadius: 16, paddingVertical: 18, alignItems: 'center', ...shadow },
  closeBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  closeBtnSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 3 },
  closedTitle: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 16, marginBottom: 8 },
  closedSub: { fontSize: 14, color: colors.textSub },
});
