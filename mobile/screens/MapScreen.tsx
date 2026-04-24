import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useDuty } from '../context/DutyContext';
import { colors, shadow } from '../theme';

export default function MapScreen() {
  const { currentLat, currentLng, gpsActive, state } = useDuty();
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [fetching, setFetching] = useState(false);
  const [lastFetch, setLastFetch] = useState('');

  useEffect(() => {
    if (currentLat && currentLng) {
      setLiveLocation({ lat: currentLat, lng: currentLng });
    }
  }, [currentLat, currentLng]);

  const refreshLocation = async () => {
    setFetching(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLiveLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLastFetch(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    } catch { }
    finally { setFetching(false); }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>My Location</Text>
        <Text style={styles.sub}>Your current GPS position</Text>

        {/* GPS status */}
        <View style={[styles.statusCard, gpsActive ? styles.statusActive : styles.statusInactive]}>
          <View style={[styles.dot, { backgroundColor: gpsActive ? colors.success : colors.textMuted }]} />
          <Text style={[styles.statusText, { color: gpsActive ? colors.success : colors.textMuted }]}>
            {gpsActive ? 'GPS Tracking Active — Live on admin dashboard' : 'GPS Tracking Inactive'}
          </Text>
        </View>

        {/* Coordinates display */}
        {liveLocation ? (
          <View style={styles.coordCard}>
            <Text style={styles.coordTitle}>📍 Current Coordinates</Text>
            <View style={styles.coordRow}>
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>LATITUDE</Text>
                <Text style={styles.coordValue}>{liveLocation.lat.toFixed(6)}°</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>LONGITUDE</Text>
                <Text style={styles.coordValue}>{liveLocation.lng.toFixed(6)}°</Text>
              </View>
            </View>
            {lastFetch ? <Text style={styles.fetchTime}>Last updated: {lastFetch}</Text> : null}
          </View>
        ) : (
          <View style={styles.noLocationCard}>
            <Text style={styles.noLocationIcon}>📡</Text>
            <Text style={styles.noLocationText}>No location data yet</Text>
            <Text style={styles.noLocationSub}>Tap refresh to get your current position</Text>
          </View>
        )}

        {/* Refresh button */}
        <TouchableOpacity style={styles.refreshBtn} onPress={refreshLocation} disabled={fetching} activeOpacity={0.85}>
          {fetching
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.refreshText}>🔄  Refresh Location</Text>}
        </TouchableOpacity>

        {/* Info about tracking */}
        {state === 'active' && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Auto Tracking</Text>
            <Text style={styles.infoText}>Your location is being sent to the admin dashboard every 15 seconds automatically while you're on duty.</Text>
          </View>
        )}

        {state === 'idle' && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Not checked in</Text>
            <Text style={styles.infoText}>Go to the Attendance tab to check in. GPS tracking will start automatically after check-in.</Text>
          </View>
        )}

        {state === 'closed' && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Shift completed</Text>
            <Text style={styles.infoText}>Your shift has ended. GPS tracking has stopped. Your route is saved on the admin dashboard.</Text>
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

  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 20 },
  statusActive: { backgroundColor: colors.successGlow, borderColor: colors.success },
  statusInactive: { backgroundColor: colors.bgCard2, borderColor: colors.border },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600', flex: 1 },

  coordCard: { backgroundColor: colors.bgCard, borderRadius: 18, padding: 22, borderWidth: 1, borderColor: colors.border, marginBottom: 16, ...shadow },
  coordTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 18 },
  coordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  coordItem: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: 40, backgroundColor: colors.border },
  coordLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  coordValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  fetchTime: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },

  noLocationCard: { backgroundColor: colors.bgCard, borderRadius: 18, padding: 32, borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginBottom: 16 },
  noLocationIcon: { fontSize: 48, marginBottom: 12 },
  noLocationText: { fontSize: 16, fontWeight: '700', color: colors.textSub, marginBottom: 6 },
  noLocationSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },

  refreshBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 16, ...shadow },
  refreshText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  infoCard: { backgroundColor: colors.bgCard2, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  infoTitle: { fontSize: 13, fontWeight: '800', color: colors.textSub, marginBottom: 8 },
  infoText: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
});
