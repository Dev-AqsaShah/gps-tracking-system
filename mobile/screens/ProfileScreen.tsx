import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, shadow } from '../theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Top brand */}
        <View style={styles.topBar}>
          <Text style={styles.brand}>TrackForce</Text>
          <Text style={styles.brandSub}>GPS Field Management</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase()}</Text>
          </View>
          <View style={styles.onlineDot} />
        </View>

        <Text style={styles.name}>{user?.name}</Text>
        <View style={styles.salesmanBadge}>
          <Text style={styles.salesmanText}>SALESMAN</Text>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <InfoRow icon="📧" label="Email" value={user?.email ?? ''} />
          {user?.companyName ? <InfoRow icon="🏢" label="Company" value={user.companyName} /> : null}
          {user?.phone ? <InfoRow icon="📞" label="Phone" value={user.phone} /> : null}
          <InfoRow icon="🆔" label="Salesman ID" value={`#${user?.id}`} />
        </View>

        {/* Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Account Active — Registered Salesman</Text>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, alignItems: 'center', padding: 28, paddingBottom: 48 },

  topBar: { alignItems: 'center', marginBottom: 36 },
  brand: { fontSize: 22, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  brandSub: { fontSize: 12, color: colors.textMuted, letterSpacing: 1.5, marginTop: 2 },

  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.primary, ...shadow,
  },
  avatarText: { fontSize: 44, fontWeight: '800', color: colors.primary },
  onlineDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.success,
    borderWidth: 3, borderColor: colors.bg,
  },

  name: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 10 },
  salesmanBadge: {
    backgroundColor: colors.primaryGlow, paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: colors.primary, marginBottom: 28,
  },
  salesmanText: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 2 },

  card: {
    width: '100%', backgroundColor: colors.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    marginBottom: 16, ...shadow,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  infoValue: { fontSize: 15, color: colors.text, fontWeight: '600' },

  statusCard: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.successGlow, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.success, marginBottom: 28,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
  statusText: { fontSize: 13, color: colors.success, fontWeight: '600' },

  logoutBtn: {
    width: '100%', backgroundColor: colors.bgCard, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.danger,
  },
  logoutText: { fontSize: 15, fontWeight: '800', color: colors.danger, letterSpacing: 1 },
});
