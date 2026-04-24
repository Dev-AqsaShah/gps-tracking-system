import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useDuty } from '../context/DutyContext';
import { colors, shadow } from '../theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { state, gpsActive } = useDuty();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>TrackForce</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase()}</Text>
          </View>
          <View style={[styles.badge, state === 'active' ? styles.badgeGreen : styles.badgeOrange]}>
            <Text style={[styles.badgeText, state === 'active' ? { color: colors.success } : { color: colors.warning }]}>
              {state === 'active' ? '● ON DUTY' : '● OFFLINE'}
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <InfoRow label="FULL NAME" value={user?.name ?? ''} />
          <InfoRow label="EMAIL" value={user?.email ?? ''} />
          {user?.phone ? <InfoRow label="PHONE" value={user.phone} /> : null}
          {user?.companyName ? <InfoRow label="COMPANY" value={user.companyName} /> : null}
          <InfoRow label="ROLE" value="Salesman" />
        </View>

        {/* GPS Badge */}
        {gpsActive && (
          <View style={styles.gpsBadge}>
            <View style={styles.gpsDot} />
            <Text style={styles.gpsText}>GPS Tracking Active — Live on dashboard</Text>
          </View>
        )}

        {/* Tip */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>How it works</Text>
          <Text style={styles.tipText}>1. Go to <Text style={styles.bold}>Attendance</Text> tab to check in</Text>
          <Text style={styles.tipText}>2. Your location will be tracked automatically</Text>
          <Text style={styles.tipText}>3. Go to <Text style={styles.bold}>Day Close</Text> tab to end shift</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 22, paddingBottom: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  brand: { fontSize: 20, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  logoutBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  logoutText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },

  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary, marginBottom: 12 },
  avatarText: { fontSize: 36, fontWeight: '800', color: colors.primary },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  badgeGreen: { backgroundColor: colors.successGlow, borderColor: colors.success },
  badgeOrange: { backgroundColor: colors.warningGlow, borderColor: colors.warning },
  badgeGray: { backgroundColor: colors.bgCard2, borderColor: colors.border },
  badgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },

  card: { backgroundColor: colors.bgCard, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16, ...shadow },
  infoRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  infoValue: { fontSize: 15, color: colors.text, fontWeight: '600' },

  gpsBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.successGlow, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.success, marginBottom: 16 },
  gpsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  gpsText: { fontSize: 12, color: colors.success, fontWeight: '600', flex: 1 },

  tipCard: { backgroundColor: colors.bgCard2, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  tipTitle: { fontSize: 13, fontWeight: '800', color: colors.textSub, marginBottom: 10, letterSpacing: 0.5 },
  tipText: { fontSize: 13, color: colors.textMuted, marginBottom: 6, lineHeight: 20 },
  bold: { color: colors.primary, fontWeight: '700' },
});
